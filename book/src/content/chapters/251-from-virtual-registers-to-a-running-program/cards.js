// From virtual registers to a running program: cards: recall prompts, examples, exercises and quiz.
// Keys are stable ids: renaming one would orphan readers' review history.

export const prompts = {
  'loop-stretch': {
    q: 'Why is a value used inside a loop given a live interval covering the whole loop?',
    a: 'The loop runs again from the top, so the value is needed on the next trip too, even after its last use in this one.',
  },
  'why-saved-only': {
    q: 'Why might a simple RISC-V register allocator hand out only s1 to s11?',
    a: 'They are callee-saved, so values in them survive calls with no saving and restoring around each call; the cost is paid once, in the prologue.',
  },
  'spill-which': {
    q: 'In Poletto and Sarkar’s linear scan, which interval is spilled when no register is free?',
    a: 'The one that ends last (among the active ones and the new one), so the others free their registers soonest.',
  },
  'save-ra': {
    q: 'Why must a function that makes a call save ra?',
    a: 'The call writes its own return address into ra, overwriting the address this function needs to return to.',
  },
  'align-16': {
    q: 'On RISC-V, why is a 24-byte stack frame rounded up to 32 bytes?',
    a: 'The psABI requires sp to be 16-byte (128-bit) aligned on entry to every procedure.',
  },
  'sim-what': {
    q: 'What does an instruction-set simulator keep in ordinary variables?',
    a: 'The registers, the program counter and memory; it fetches, decodes and executes one instruction at a time.',
  },
  'call-reloc': {
    q: 'Why does a RISC-V `call f` to a global function leave an R_RISCV_CALL_PLT relocation in the object file?',
    a: 'The assembler cannot know how far away f will be once everything is linked, so the linker fills in the auipc/jalr offset.',
  },
  relax: {
    q: 'Why does clang (with linker relaxation on) leave even a local branch as a relocation?',
    a: 'Relaxation may delete bytes at link time and move the branch target, so the linker must fix the offset.',
  },
  'clang-no-frame': {
    q: 'A small RISC-V function that makes no calls is compiled with no stack frame at all. Why can it do without one?',
    a: 'With no calls, ra is never overwritten and caller-saved a and t registers are enough for its values, so there is nothing to save.',
  },
};

export const examples = {
  whole: {
    title: 'The whole compiler, and a simulator',
    code: `// Stage 1: scan. Drop comments, then
// cut the text into tokens.
function scan(src) {
  const re = /\\d+|\\w+|[<>=!+-]=|\\S/g;
  return src.replace(/#.*/g, '')
    .match(re) ?? [];
}

// Stage 2: parse (recursive descent).
const RELOPS = ['<', '<=', '>', '>=',
  '==', '!='];
function parse(src) {
  const t = scan(src);
  let p = 0;
  const peek = () => t[p];
  const fail = (what) => {
    const got = t[p] ?? 'end of file';
    throw new Error(\`expected \${what}\` +
      \`, found '\${got}'\`);
  };
  const eat = (x) => {
    if (x && t[p] !== x) fail(\`'\${x}'\`);
    return t[p++];
  };
  const fns = [], main = [];
  while (p < t.length) {
    if (peek() === 'fn')
      fns.push(fnDecl());
    else main.push(stmt());
  }
  fns.push(['fn', 'main', [], main]);
  return fns;

  function fnDecl() {
    eat('fn');
    const name = eat(), ps = [];
    eat('(');
    while (peek() !== ')') {
      ps.push(eat());
      if (peek() === ',') eat(',');
    }
    eat(')');
    return ['fn', name, ps, block()];
  }
  function block() {
    eat('{');
    const ss = [];
    while (peek() !== '}')
      ss.push(stmt());
    eat('}');
    return ss;
  }
  function stmt() {
    const k = peek();
    if (k === 'let') {
      eat(); const x = eat(); eat('=');
      const e = expr(); eat(';');
      return ['let', x, e];
    }
    if (k === 'if') {
      eat(); const c = cond();
      const th = block();
      let el = [];
      if (peek() === 'else') {
        eat();
        el = peek() === 'if'
          ? [stmt()] : block();
      }
      return ['if', c, th, el];
    }
    if (k === 'while') {
      eat(); const c = cond();
      return ['while', c, block()];
    }
    if (k === 'return' ||
        k === 'print') {
      eat(); const e = expr(); eat(';');
      return [k, e];
    }
    const op = t[p + 1];
    if (op === '=' || op === '+=' ||
        op === '-=') {
      const x = eat(); eat();
      let e = expr(); eat(';');
      if (op !== '=')
        e = [op[0], ['var', x], e];
      return ['set', x, e];
    }
    const e = expr(); eat(';');
    return ['expr', e];
  }
  function cond() {
    const a = expr();
    if (!RELOPS.includes(peek()))
      fail('a comparison');
    const op = eat();
    return [op, a, expr()];
  }
  function expr() {
    let e = term();
    while (peek() === '+' ||
           peek() === '-')
      e = [eat(), e, term()];
    return e;
  }
  function term() {
    let e = unary();
    while (peek() === '*')
      e = [eat(), e, unary()];
    return e;
  }
  function unary() {
    if (peek() !== '-')
      return primary();
    eat();
    return ['-', ['num', 0], unary()];
  }
  function primary() {
    const x = peek();
    if (/^\\d+$/.test(x)) {
      eat();
      return ['num', Number(x)];
    }
    if (x === '(') {
      eat(); const e = expr(); eat(')');
      return e;
    }
    if (!/^[A-Za-z_]\\w*$/.test(x ?? ''))
      fail('an expression');
    eat();
    if (peek() !== '(')
      return ['var', x];
    eat('(');
    const args = [];
    while (peek() !== ')') {
      args.push(expr());
      if (peek() === ',') eat(',');
    }
    eat(')');
    return ['call', x, args];
  }
}


// Stage 3: instruction selection, into
// virtual registers v0, v1, v2, ...
const ARITH = { '+': 'add', '-': 'sub',
  '*': 'mul' };
// jump to \`no\` when the test FAILS:
// [instruction, first, second operand]
const BR = {
  '<': ['bge', 0, 1],
  '<=': ['blt', 1, 0],
  '>': ['bge', 1, 0],
  '>=': ['blt', 0, 1],
  '==': ['bne', 0, 1],
  '!=': ['beq', 0, 1],
};
const fits12 = (k) =>
  k >= -2048 && k <= 2047;

function select([, name, ps, body]) {
  const code = [], vars = new Map();
  let nv = 0, nl = 0;
  const v = () => 'v' + nv++;
  const L = () => \`.L\${name}\${nl++}\`;
  const emit = (...i) => code.push(i);
  const look = (x) => {
    if (!vars.has(x)) throw new Error(
      \`undefined variable '\${x}'\`);
    return vars.get(x);
  };
  if (ps.length > 8) throw new Error(
    'at most 8 parameters');
  ps.forEach((x, k) => {
    vars.set(x, v());
    emit('mv', vars.get(x), 'a' + k);
  });
  body.forEach(stmt);
  if (body.at(-1)?.[0] !== 'return')
    emit('li', 'a0', 0);
  return { name, code };

  function stmt(s) {
    const k = s[0];
    if (k === 'let') {
      const d = v();
      expr(s[2], d);
      vars.set(s[1], d);
    } else if (k === 'set') {
      expr(s[2], look(s[1]));
    } else if (k === 'expr') {
      expr(s[1]);
    } else if (k === 'print') {
      emit('mv', 'a0', expr(s[1]));
      emit('call', 'print');
    } else if (k === 'return') {
      emit('mv', 'a0', expr(s[1]));
      emit('j', \`.L\${name}_ret\`);
    } else if (k === 'while') {
      const top = L(), end = L();
      emit('label', top);
      cond(s[1], end);
      s[2].forEach(stmt);
      emit('j', top);
      emit('label', end);
    } else if (k === 'if') {
      const no = L(), end = L();
      cond(s[1], no);
      s[2].forEach(stmt);
      if (s[3].length) emit('j', end);
      emit('label', no);
      s[3].forEach(stmt);
      if (s[3].length)
        emit('label', end);
    }
  }
  function cond([op, a, b], no) {
    const ra = expr(a);
    const zero = b[0] === 'num' &&
      b[1] === 0;
    const r = [ra,
      zero ? 'zero' : expr(b)];
    const [br, i, j] = BR[op];
    emit(br, r[i], r[j], no);
  }
  function expr(e, d) {
    const k = e[0];
    if (k === 'num') {
      d ??= v();
      emit('li', d, e[1]);
      return d;
    }
    if (k === 'var') {
      const r = look(e[1]);
      if (d && d !== r)
        emit('mv', d, r);
      return d ?? r;
    }
    if (k === 'call') {
      if (e[2].length > 8)
        throw new Error('at most 8');
      const rs = e[2].map(
        (a) => expr(a));
      rs.forEach((r, i) =>
        emit('mv', 'a' + i, r));
      emit('call', e[1]);
      d ??= v();
      emit('mv', d, 'a0');
      return d;
    }
    const [, a, b] = e;
    const imm =
      k === '-' ? -b[1] : b[1];
    if (k !== '*' && b[0] === 'num' &&
        fits12(imm)) {
      const ra = expr(a);
      d ??= v();
      emit('addi', d, ra, imm);
      return d;
    }
    const ra = expr(a), rb = expr(b);
    d ??= v();
    emit(ARITH[k], d, ra, rb);
    return d;
  }
}

function show(code) {
  return code.map(([op, ...xs]) =>
    op === 'label' ? xs[0] + ':'
      : ('  ' + op.padEnd(5) +
        xs.join(', ')).trimEnd())
    .join('\\n');
}


// Stage 4: live intervals.
const isV = (x) => /^v\\d+$/.test(x);
function intervals(code) {
  const iv = new Map();
  code.forEach((ins, n) => {
    for (const x of ins.slice(1)) {
      if (!isV(x)) continue;
      const r = iv.get(x);
      if (r) r.end = n;
      else iv.set(x,
        { v: x, start: n, end: n });
    }
  });
  // a value alive anywhere in a loop
  // stays alive for the whole loop
  const at = new Map();
  code.forEach(([op, x], n) => {
    if (op === 'label') at.set(x, n);
  });
  let changed = true;
  while (changed) {
    changed = false;
    code.forEach((ins, n) => {
      const top = at.get(ins.at(-1));
      if (ins[0] === 'label' ||
          !(top < n)) return;
      for (const r of iv.values()) {
        if (r.end < top || r.start > n)
          continue;
        const s =
          Math.min(r.start, top);
        const e = Math.max(r.end, n);
        if (s < r.start || e > r.end) {
          r.start = s; r.end = e;
          changed = true;
        }
      }
    });
  }
  return [...iv.values()]
    .sort((a, b) => a.start - b.start);
}

// Stage 5: linear scan over s1..s11.
const SAVED = ['s1', 's2', 's3', 's4',
  's5', 's6', 's7', 's8', 's9', 's10',
  's11'];
function linearScan(ivs, regs = SAVED) {
  const free = [...regs], active = [];
  const where = new Map();
  let slots = 0;
  for (const r of ivs) {
    // free the registers of intervals
    // that ended before this one starts
    for (const a of [...active]) {
      if (a.end >= r.start) continue;
      active.splice(
        active.indexOf(a), 1);
      free.push(where.get(a.v));
    }
    if (free.length) {
      where.set(r.v, free.shift());
      active.push(r);
      continue;
    }
    // no register: spill the interval
    // that ends last
    active.sort(
      (a, b) => a.end - b.end);
    const last = active.at(-1);
    if (last.end > r.end) {
      where.set(r.v, where.get(last.v));
      where.set(last.v,
        'slot' + slots++);
      active.pop();
      active.push(r);
    } else {
      where.set(r.v, 'slot' + slots++);
    }
  }
  return { where, slots };
}

// Stage 6: rewrite, frame, peephole.
const DEF = new Set(['li', 'mv', 'add',
  'addi', 'sub', 'mul']);
const inSlot = (w) =>
  w.startsWith('slot');
function finish({ name, code }, regs) {
  const { where, slots } =
    linearScan(intervals(code), regs);
  const used = [
    ...new Set(where.values()),
  ].filter((w) => !inSlot(w));
  const calls = code.some(
    (i) => i[0] === 'call') ? 1 : 0;
  const words = slots + used.length +
    calls;
  const F = Math.ceil(words / 2) * 16;
  const slot = (w) =>
    \`\${8 * w.slice(4)}(sp)\`;
  const save = (k) =>
    \`\${F - 8 * (k + 1 + calls)}(sp)\`;
  const out = [];
  const E = (...i) => out.push(i);
  if (F) E('addi', 'sp', 'sp', -F);
  const raAt = \`\${F - 8}(sp)\`;
  if (calls) E('sd', 'ra', raAt);
  used.forEach((s, k) =>
    E('sd', s, save(k)));
  for (const [op, ...xs] of code) {
    if (op === 'label') {
      E(op, xs[0]);
      continue;
    }
    const tmp = ['t0', 't1'];
    const def =
      DEF.has(op) && isV(xs[0])
        ? where.get(xs[0]) : null;
    const ys = xs.map((x, k) => {
      if (!isV(x)) return x;
      const w = where.get(x);
      if (!inSlot(w)) return w;
      if (k === 0 && def) return 't2';
      const t = tmp.shift();
      E('ld', t, slot(w));
      return t;
    });
    E(op, ...ys);
    if (def && inSlot(def))
      E('sd', 't2', slot(def));
  }
  E('label', \`.L\${name}_ret\`);
  used.forEach((s, k) =>
    E('ld', s, save(k)));
  if (calls) E('ld', 'ra', raAt);
  if (F) E('addi', 'sp', 'sp', F);
  E('ret');
  // peephole: drop "mv x, x" and a jump
  // to the label on the very next line
  const keep = out.filter((i, n) => {
    const nx = out[n + 1];
    if (i[0] === 'mv' && i[1] === i[2])
      return false;
    return !(i[0] === 'j' && nx &&
      nx[0] === 'label' &&
      nx[1] === i[1]);
  });
  return [
    \`  .globl \${name}\`, \`\${name}:\`,
    ...keep.map(([op, ...xs]) =>
      op === 'label' ? xs[0] + ':'
        : ('  ' + op.padEnd(5) +
          xs.join(', ')).trimEnd()),
  ].join('\\n');
}


// Stage 7: a tiny RISC-V simulator.
// Registers hold 64-bit BigInts.
function simulate(asm, limit = 1e6) {
  const prog = [], labels = new Map();
  for (const raw of asm.split('\\n')) {
    const l = raw.replace(/#.*/, '')
      .trim();
    if (!l || l[0] === '.' &&
        !l.endsWith(':')) continue;
    if (l.endsWith(':'))
      labels.set(l.slice(0, -1),
        prog.length);
    else prog.push(l.split(/[\\s,()]+/)
      .filter(Boolean));
  }
  const reg = new Map([
    ['sp', 1n << 20n], ['ra', -1n]]);
  const get = (r) => r === 'zero'
    ? 0n : reg.get(r) ?? 0n;
  const set = (r, x) => {
    if (r !== 'zero')
      reg.set(r, BigInt.asIntN(64, x));
  };
  const mem = new Map(), out = [];
  const go = (l) => {
    if (!labels.has(l))
      throw new Error(
        \`no label '\${l}'\`);
    return labels.get(l);
  };
  const ALU = {
    add: (x, y) => x + y,
    sub: (x, y) => x - y,
    mul: (x, y) => x * y,
  };
  const BR = {
    beq: (x, y) => x === y,
    bne: (x, y) => x !== y,
    blt: (x, y) => x < y,
    bge: (x, y) => x >= y,
  };
  let pc = go('main'), steps = 0;
  while (pc >= 0) {
    if (++steps > limit)
      throw new Error('too many steps');
    const [op, a, b, c] = prog[pc++];
    if (op in ALU)
      set(a, ALU[op](get(b), get(c)));
    else if (op in BR) {
      if (BR[op](get(a), get(b)))
        pc = go(c);
    } else if (op === 'li')
      set(a, BigInt(b));
    else if (op === 'mv')
      set(a, get(b));
    else if (op === 'addi')
      set(a, get(b) + BigInt(c));
    else if (op === 'sd')
      mem.set(get(c) + BigInt(b),
        get(a));
    else if (op === 'ld')
      set(a,
        mem.get(get(c) + BigInt(b)));
    else if (op === 'j') pc = go(a);
    else if (op === 'call' &&
             a === 'print')
      out.push(String(get('a0')));
    else if (op === 'call') {
      set('ra', BigInt(pc));
      pc = go(a);
    } else if (op === 'ret')
      pc = Number(get('ra'));
    else throw new Error(
      \`unknown instruction '\${op}'\`);
  }
  return out.join('\\n');
}



const src = \`
fn sumsq(n) {
  let s = 0;
  let i = 0;
  while i < n {
    s += i * i;
    i += 1;
  }
  return s;
}
fn fib(n) {
  if n < 2 {
    return n;
  }
  return fib(n - 1) + fib(n - 2);
}
print sumsq(4);
let k = 0;
while k <= 10 {
  print fib(k);
  k += 1;
}\`;

const REGS = SAVED; // try ['s1', 's2']
const parts = parse(src).map(
  (f) => finish(select(f), REGS));
console.log(parts[0]);
console.log('--- output');
console.log(simulate(parts.join('\\n')));`,
  },
};

export const exercises = {
  'mini-sim': {
    title: 'A RISC-V simulator for eleven instructions',
    prompt: 'Finish `run(asm, args)`, a tiny simulator. It already handles labels, `li`, `mv`, `j` and `ret`; add `add`, `sub` and `mul` (rd, rs1, rs2), `addi` (rd, rs1, constant), and the branches `beq`, `bne`, `blt` and `bge` (rs1, rs2, label), which jump to the label when the comparison holds. Registers are plain numbers here, and `zero` always reads 0. The tests run real listings from this part, including sumsq.',
    starter: `// run(asm, args): run the function at
// the top of asm, with args in a0, a1,
// ...; returns a0 when it reaches ret
function run(asm, args) {
  const prog = [], labels = new Map();
  for (const raw of asm.split('\\n')) {
    const l = raw.replace(/#.*/, '')
      .trim();
    if (!l) continue;
    if (l.endsWith(':'))
      labels.set(l.slice(0, -1),
        prog.length);
    else prog.push(l.split(/[\\s,]+/));
  }
  const r = { zero: 0 };
  args.forEach((v, k) => {
    r['a' + k] = v;
  });
  const get = (x) => r[x] ?? 0;
  const set = (x, v) => {
    if (x !== 'zero') r[x] = v;
  };
  let pc = 0;
  for (let n = 0; n < 100000; n++) {
    const [op, a, b, c] = prog[pc++];
    if (op === 'ret') return get('a0');
    if (op === 'li') set(a, Number(b));
    else if (op === 'mv')
      set(a, get(b));
    else if (op === 'j')
      pc = labels.get(a);
    // add, sub, mul, addi,
    // beq, bne, blt, bge go here
    else throw new Error(
      \`unknown instruction '\${op}'\`);
  }
  throw new Error('too many steps');
}`,
    solution: `const ALU = {
  add: (x, y) => x + y,
  sub: (x, y) => x - y,
  mul: (x, y) => x * y,
};
const BR = {
  beq: (x, y) => x === y,
  bne: (x, y) => x !== y,
  blt: (x, y) => x < y,
  bge: (x, y) => x >= y,
};
// run(asm, args): run the function at
// the top of asm, with args in a0, a1,
// ...; returns a0 when it reaches ret
function run(asm, args) {
  const prog = [], labels = new Map();
  for (const raw of asm.split('\\n')) {
    const l = raw.replace(/#.*/, '')
      .trim();
    if (!l) continue;
    if (l.endsWith(':'))
      labels.set(l.slice(0, -1),
        prog.length);
    else prog.push(l.split(/[\\s,]+/));
  }
  const r = { zero: 0 };
  args.forEach((v, k) => {
    r['a' + k] = v;
  });
  const get = (x) => r[x] ?? 0;
  const set = (x, v) => {
    if (x !== 'zero') r[x] = v;
  };
  let pc = 0;
  for (let n = 0; n < 100000; n++) {
    const [op, a, b, c] = prog[pc++];
    if (op === 'ret') return get('a0');
    if (op === 'li') set(a, Number(b));
    else if (op === 'mv')
      set(a, get(b));
    else if (op === 'j')
      pc = labels.get(a);
    else if (op in ALU)
      set(a, ALU[op](get(b), get(c)));
    else if (op === 'addi')
      set(a, get(b) + Number(c));
    else if (op in BR) {
      if (BR[op](get(a), get(b)))
        pc = labels.get(c);
    }
    else throw new Error(
      \`unknown instruction '\${op}'\`);
  }
  throw new Error('too many steps');
}`,
    tests: `const SUMSQ = \`
    li   t0, 0
    li   t1, 0
loop:
    bge  t1, a0, done
    mul  t2, t1, t1
    add  t0, t0, t2
    addi t1, t1, 1
    j    loop
done:
    mv   a0, t0
    ret\`;
test('sumsq(4) is 14', () => {
  expect(run(SUMSQ, [4])).toBe(14);
});
test('sumsq(0) is 0, sumsq(10) is 285',
  () => {
    expect(run(SUMSQ, [0])).toBe(0);
    expect(run(SUMSQ, [10])).toBe(285);
  });
test('sub keeps the operand order', () => {
  expect(run('sub a0, a0, a1\\nret',
    [10, 3])).toBe(7);
});
test('blt picks the larger', () => {
  const MAX = \`blt a0, a1, take
ret
take:
mv a0, a1
ret\`;
  expect(run(MAX, [3, 7])).toBe(7);
  expect(run(MAX, [9, 2])).toBe(9);
});
test('beq against zero ends a loop', () => {
  const TWICE = \`li t0, 0
loop:
beq a0, zero, done
addi a0, a0, -1
addi t0, t0, 2
j loop
done:
mv a0, t0
ret\`;
  expect(run(TWICE, [5])).toBe(10);
});
test('bne', () => {
  const EQ = \`bne a0, a1, no
li a0, 1
ret
no:
li a0, 0
ret\`;
  expect(run(EQ, [4, 4])).toBe(1);
  expect(run(EQ, [4, 5])).toBe(0);
});`,
    hints: [
      'Every new instruction is either "compute something into rd" or "maybe jump". Which operands are registers and which is a constant or a label?',
      'For add, sub and mul: `set(a, get(b) OP get(c))`. For addi the third operand is a number written in the text, so use `Number(c)` instead of `get(c)`. For a branch, compare `get(a)` and `get(b)`, and if it holds set `pc = labels.get(c)`.',
      'Two small tables keep it short: `const ALU = { add: (x, y) => x + y, ... }` and `const BR = { beq: (x, y) => x === y, ... }`; then `else if (op in ALU) set(a, ALU[op](get(b), get(c)));` and `else if (op in BR) { if (BR[op](get(a), get(b))) pc = labels.get(c); }`.',
    ],
    walkthrough: `**How to think about it.** A simulator is the processor's fetch, decode and execute loop written in software: read the instruction at \`pc\`, move \`pc\` on, and do what the instruction says to the registers. The starter already does the fetching (\`prog[pc++]\`), the decoding (splitting the text into the operation and its operands) and four instructions. The eight that are left fall into two families, and seeing that is most of the work: three-register arithmetic (\`add\`, \`sub\`, \`mul\` all read rs1 and rs2 and write rd), one with a constant (\`addi\`), and four branches that read two registers and maybe change \`pc\`. Two small tables of functions keep each family to one line of the loop.

**The solution, line by line.**

- \`const ALU = { add: (x, y) => x + y, sub: (x, y) => x - y, mul: (x, y) => x * y };\` maps each arithmetic instruction to what it computes. The order of \`x\` and \`y\` matters for \`sub\`: \`sub a0, a0, a1\` is a0 minus a1.
- \`const BR = { beq: ..., bne: ..., blt: ..., bge: ... };\` maps each branch to its test: equal, not equal, less than, greater or equal.
- \`else if (op in ALU) set(a, ALU[op](get(b), get(c)));\` reads the two source registers, computes, and writes the destination; \`set\` ignores writes to \`zero\`, so \`zero\` stays 0.
- \`else if (op === 'addi') set(a, get(b) + Number(c));\` is the same with a constant: the third operand is text like \`-1\`, so it is turned into a number rather than looked up as a register.
- \`else if (op in BR) { if (BR[op](get(a), get(b))) pc = labels.get(c); }\` compares the two registers and, only when the test holds, moves \`pc\` to the label's position; otherwise \`pc\` already points at the next instruction, so execution falls through.

For \`sumsq(4)\` the loop runs four times, adding 0, 1, 4 and 9 into \`t0\`, and the fifth \`bge\` sees \`t1\` equal to 4 and jumps to \`done\`.

**Common wrong attempts.**

- Using \`get(c)\` for \`addi\` looks up a register called "1", which does not exist, so it reads 0 and \`i\` never grows: the loop runs until the step limit.
- Writing the branch as "jump when the test fails" mixes up the instruction with the code shape: \`bge t1, a0, done\` jumps when t1 >= a0 holds; it is the compiler that chose \`bge\` because the loop test \`i < n\` had failed.
- Forgetting that a branch that is not taken must leave \`pc\` alone (for example writing \`pc = cond ? labels.get(c) : pc + 1\`) skips an instruction, because \`pc\` was already moved on when the instruction was fetched.`,
    wrong: [
      {
        code: `const ALU = {
  add: (x, y) => x + y,
  sub: (x, y) => y - x,
  mul: (x, y) => x * y,
};
const BR = {
  beq: (x, y) => x === y,
  bne: (x, y) => x !== y,
  blt: (x, y) => x < y,
  bge: (x, y) => x >= y,
};
// run(asm, args): run the function at
// the top of asm, with args in a0, a1,
// ...; returns a0 when it reaches ret
function run(asm, args) {
  const prog = [], labels = new Map();
  for (const raw of asm.split('\\n')) {
    const l = raw.replace(/#.*/, '')
      .trim();
    if (!l) continue;
    if (l.endsWith(':'))
      labels.set(l.slice(0, -1),
        prog.length);
    else prog.push(l.split(/[\\s,]+/));
  }
  const r = { zero: 0 };
  args.forEach((v, k) => {
    r['a' + k] = v;
  });
  const get = (x) => r[x] ?? 0;
  const set = (x, v) => {
    if (x !== 'zero') r[x] = v;
  };
  let pc = 0;
  for (let n = 0; n < 100000; n++) {
    const [op, a, b, c] = prog[pc++];
    if (op === 'ret') return get('a0');
    if (op === 'li') set(a, Number(b));
    else if (op === 'mv')
      set(a, get(b));
    else if (op === 'j')
      pc = labels.get(a);
    else if (op in ALU)
      set(a, ALU[op](get(b), get(c)));
    else if (op === 'addi')
      set(a, get(b) + Number(c));
    else if (op in BR) {
      if (BR[op](get(a), get(b)))
        pc = labels.get(c);
    }
    else throw new Error(
      \`unknown instruction '\${op}'\`);
  }
  throw new Error('too many steps');
}`,
        why: '`sub` computes rs2 − rs1, so `sub a0, a0, a1` with 10 and 3 gives −7 instead of 7.',
      },
      {
        code: `const ALU = {
  add: (x, y) => x + y,
  sub: (x, y) => x - y,
  mul: (x, y) => x * y,
};
const BR = {
  beq: (x, y) => x === y,
  bne: (x, y) => x !== y,
  blt: (x, y) => x < y,
  bge: (x, y) => x >= y,
};
// run(asm, args): run the function at
// the top of asm, with args in a0, a1,
// ...; returns a0 when it reaches ret
function run(asm, args) {
  const prog = [], labels = new Map();
  for (const raw of asm.split('\\n')) {
    const l = raw.replace(/#.*/, '')
      .trim();
    if (!l) continue;
    if (l.endsWith(':'))
      labels.set(l.slice(0, -1),
        prog.length);
    else prog.push(l.split(/[\\s,]+/));
  }
  const r = { zero: 0 };
  args.forEach((v, k) => {
    r['a' + k] = v;
  });
  const get = (x) => r[x] ?? 0;
  const set = (x, v) => {
    if (x !== 'zero') r[x] = v;
  };
  let pc = 0;
  for (let n = 0; n < 100000; n++) {
    const [op, a, b, c] = prog[pc++];
    if (op === 'ret') return get('a0');
    if (op === 'li') set(a, Number(b));
    else if (op === 'mv')
      set(a, get(b));
    else if (op === 'j')
      pc = labels.get(a);
    else if (op in ALU)
      set(a, ALU[op](get(b), get(c)));
    else if (op === 'addi')
      set(a, get(b) + get(c));
    else if (op in BR) {
      if (BR[op](get(a), get(b)))
        pc = labels.get(c);
    }
    else throw new Error(
      \`unknown instruction '\${op}'\`);
  }
  throw new Error('too many steps');
}`,
        why: '`addi` looks its constant up as a register, which reads 0, so `addi t1, t1, 1` never changes t1 and sumsq loops until the step limit.',
      },
    ],
  },
};

export const quiz = [
  {
    q: 'Linear scan reaches a new interval that ends at line 9, with both registers taken by active intervals that end at lines 8 and 10. Under the rule “spill the interval that ends last”, what happens?',
    options: [
      {
        t: 'The allocator gives up: the function cannot be compiled.',
        why: 'An allocator never gives up; it spills.',
      },
      {
        t: 'The interval ending at line 10 is spilled, and its register goes to the new one.',
        correct: true,
        why: 'Right: it ends last, so spilling it frees a register for the longest time.',
      },
      {
        t: 'The interval ending at line 8 is spilled, because it was allocated first.',
        why: 'The rule is about which interval ends last, not which came first.',
      },
      {
        t: 'The new interval is spilled, because it arrived last.',
        why: 'It ends at line 9, before the line-10 interval, so spilling it would free nothing for as long.',
      },
    ],
  },
  {
    q: 'A RISC-V compiler keeps the result of `fib(n - 1)` in a callee-saved register while it calls `fib(n - 2)`. Why does the value survive the second call?',
    options: [
      {
        t: 'The first result is in an s register, which fib’s callee must restore before returning.',
        correct: true,
        why: 'Right: the callee saves any s register it uses and restores it before returning.',
      },
      {
        t: 'The first result stays in a0, which the second call does not touch.',
        why: 'The second call puts its argument in a0 and returns its result there.',
      },
      {
        t: 'Calls never change registers.',
        why: 'They may change every caller-saved register: ra, t0 to t6 and a0 to a7.',
      },
    ],
  },
  {
    q: 'A RISC-V function uses s1 and s2, makes calls, and keeps nothing else on the stack. How big is its frame, and why?',
    options: [
      {
        t: '24 bytes: ra, s1 and s2.',
        why: 'That would leave sp 8 bytes off a multiple of 16, which the psABI forbids at the next call.',
      },
      {
        t: '16 bytes: s1 and s2 only.',
        why: 'The function makes calls, so its own return address in ra would be overwritten; it must be saved.',
      },
      {
        t: '32 bytes: ra, s1 and s2, rounded up to a multiple of 16.',
        correct: true,
        why: 'Right: three 8-byte words, and 8 bytes of padding to keep the stack 16-byte aligned.',
      },
    ],
  },
  {
    q: 'After `llvm-mc -filetype=obj` (no linker relaxation), why is a loop’s `bge` already finished but a `call` to a global function is not?',
    options: [
      {
        t: 'The branch target is in the same section at a known distance; where the callee ends up is only known after linking, so the call gets a relocation.',
        correct: true,
        why: 'Right: R_RISCV_CALL_PLT marks the auipc/jalr pair for the linker to fill in.',
      },
      {
        t: 'Branches never need relocations.',
        why: 'With linker relaxation on (clang’s default) even local branches get R_RISCV_BRANCH relocations.',
      },
      {
        t: 'llvm-mc does not support calls.',
        why: 'It does; it expands call into auipc and jalr and records the relocation.',
      },
    ],
  },
  {
    q: 'What is an instruction-set simulator?',
    options: [
      {
        t: 'A compiler that turns assembly into machine code.',
        why: 'That is an assembler.',
      },
      {
        t: 'A program that runs machine instructions in software, keeping registers, pc and memory in variables.',
        correct: true,
        why: 'Right: it repeats fetch, decode and execute, like the hardware.',
      },
      {
        t: 'A tool that measures how fast code will run on a chip.',
        why: 'Some simulators also model timing, but the definition is about running the instructions, not timing them.',
      },
    ],
  },
  {
    q: 'Which of these does clang -O2 do for a sum-of-squares loop that a minimal teaching compiler (callee-saved registers only, loop test at the top) does not?',
    options: [
      {
        t: 'Following the calling convention: n in a0, the result in a0.',
        why: 'Both do; any compiler must, to call and be called.',
      },
      {
        t: 'Saving s registers it uses in a prologue.',
        why: 'That is what the teaching compiler does; clang avoids it by not using s registers at all.',
      },
      {
        t: 'Keeping a leaf function’s values in caller-saved registers, with no frame, and testing the loop at the bottom.',
        correct: true,
        why: 'Right: these are optimisations; every stage is the same.',
      },
    ],
  },
];
