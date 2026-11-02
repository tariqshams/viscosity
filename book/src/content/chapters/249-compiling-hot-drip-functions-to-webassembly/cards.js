// Chapter 244 cards: recall prompts, examples, exercises and quiz.
// Keys are stable ids: renaming one would orphan readers' review history.

export const prompts = {
  'jit-three-parts': {
    q: 'What are the three parts of the chapter’s JIT?',
    a: 'A counter (compile once a function is hot), a compiler (tree to WebAssembly, or refuse) and a guard (only safe calls reach the compiled code).',
  },
  'why-count': {
    q: 'Why does a JIT wait for a function to be called several times before compiling it?',
    a: 'Compiling costs time; a function called once or twice never pays it back.',
  },
  'children-first': {
    q: 'In what order does the compiler emit code for `a - b` on a stack machine?',
    a: 'The code for a, then the code for b, then f64.sub (children first, operator last).',
  },
  'while-shape': {
    q: 'Which WebAssembly instructions does a `while` loop become?',
    a: '`block`, `loop`, the test, `i32.eqz`, `br_if 1` (leave), the body, `br 0` (repeat), `end`, `end`.',
  },
  'locals-order': {
    q: 'In `sumsq(n)` with `let s` and `let i`, which local numbers do n, s and i get?',
    a: 'n is 0 (parameters first), s is 1 and i is 2, in the order they are declared.',
  },
  'why-no-rem': {
    q: 'Why does the JIT refuse a function that uses `%`?',
    a: 'WebAssembly has remainder instructions only for integers; there is no f64 remainder.',
  },
  'truthy-zero': {
    q: 'Why must the JIT not compile `while n { ... }` as "loop while n is not 0"?',
    a: 'In Drip every number, even 0, is truthy, so that loop never stops on its own; testing against 0 would change its meaning.',
  },
  'guard-why': {
    q: 'What does the guard check, and why?',
    a: 'That there are the right number of arguments and all are numbers; otherwise ToNumber would silently convert them where Drip reports an error.',
  },
  'liftoff-what': {
    q: 'What is V8’s Liftoff?',
    a: 'A baseline WebAssembly compiler: one pass over the function’s bytes, with a virtual stack of where each operand lives.',
  },
  'guard-vs-deopt': {
    q: 'How does a speculating JIT’s check differ from this chapter’s guard?',
    a: 'It checks inside the compiled code and can deoptimise halfway through; our guard only checks the arguments before the call.',
  },
};

export const examples = {
  jit: {
    title: 'A JIT for Drip, from scratch',
    code: `// --- the encoder (chapter 248) ---
function uleb(n) {
  const out = [];
  do {
    let b = n & 0x7f;
    n >>>= 7;
    if (n !== 0) b |= 0x80;
    out.push(b);
  } while (n !== 0);
  return out;
}
const sec = (id, b) =>
  [id, ...uleb(b.length), ...b];
const F64 = 0x7c;
// one exported function "f":
// nParams f64s in, one f64 out
function wasm(nParams, nLocals, code) {
  const ps = Array(nParams).fill(F64);
  const locals = nLocals
    ? [1, ...uleb(nLocals), F64] : [0];
  const body = [...locals, ...code,
    0x0b];
  return new Uint8Array([
    0, 0x61, 0x73, 0x6d, 1, 0, 0, 0,
    ...sec(1, [1, 0x60, nParams, ...ps,
      1, F64]),
    ...sec(3, [1, 0]),
    ...sec(7, [1, 1, 0x66, 0, 0]),
    ...sec(10, [1, ...uleb(body.length),
      ...body]),
  ]);
}

// --- the compiler: tree -> Wasm ---
const OP = { '+': 0xa0, '-': 0xa1,
  '*': 0xa2, '/': 0xa3 };
const CMP = { '==': 0x61, '!=': 0x62,
  '<': 0x63, '>': 0x64, '<=': 0x65,
  '>=': 0x66 };
function f64(x) {
  const b = new Uint8Array(8);
  new DataView(b.buffer)
    .setFloat64(0, x, true);
  return [...b];
}
function compile([params, body]) {
  const slot = new Map();
  params.forEach((p, i) =>
    slot.set(p, i));
  const out = [];
  const no = (why) => {
    throw new Error('no JIT: ' + why);
  };
  const local = (x) => slot.has(x)
    ? slot.get(x) : no(\`'\${x}'\`);
  function expr(e) {
    const [k, a, b] = e;
    if (k === 'num')
      out.push(0x44, ...f64(a));
    else if (k === 'var')
      out.push(0x20, local(a));
    else if (k in OP) {
      expr(a); expr(b);
      out.push(OP[k]);
    } else no(\`'\${k}' in an expr\`);
  }
  function cond([k, a, b]) {
    if (!(k in CMP))
      no('a condition must compare');
    expr(a); expr(b);
    out.push(CMP[k]);
  }
  function stmt(s) {
    const k = s[0];
    if (k === 'let' || k === 'set') {
      if (k === 'let' && slot.has(s[1]))
        no('a redeclared name');
      expr(s[2]);
      if (k === 'let')
        slot.set(s[1], slot.size);
      out.push(0x21, local(s[1]));
    } else if (k === 'while') {
      out.push(0x02, 0x40, 0x03, 0x40);
      cond(s[1]);
      out.push(0x45, 0x0d, 1);
      s[2].forEach(stmt);
      out.push(0x0c, 0, 0x0b, 0x0b);
    } else if (k === 'if') {
      cond(s[1]);
      out.push(0x04, 0x40);
      s[2].forEach(stmt);
      out.push(0x05);
      s[3].forEach(stmt);
      out.push(0x0b);
    } else if (k === 'return') {
      expr(s[1]);
      out.push(0x0f);
    } else no(\`'\${k}'\`);
  }
  body.forEach(stmt);
  if (body.at(-1)?.[0] !== 'return')
    no('it may end without a return');
  const n = params.length;
  const W = WebAssembly;
  const m = new W.Module(
    wasm(n, slot.size - n, out));
  return new W.Instance(m).exports.f;
}

// --- a small tree-walker ---
function interp([params, body], args) {
  const env = new Map();
  params.forEach((p, i) =>
    env.set(p, args[i]));
  const ty = (x) =>
    typeof x === 'number'
      ? 'a number' : 'a ' + typeof x;
  const ev = ([k, a, b]) => {
    if (k === 'num') return a;
    if (k === 'var') return env.get(a);
    const x = ev(a), y = ev(b);
    if (k === '==') return x === y;
    if (k === '!=') return x !== y;
    const two = \`\${ty(x)} and \${ty(y)}\`;
    const cmp = '<><=>='.includes(k);
    const msg = k === '+'
      ? \`cannot add \${two}\`
      : cmp
        ? \`cannot compare \${two}\` +
          \` with '\${k}'\`
        : \`cannot use '\${k}' on \${two}\`;
    if (ty(x) !== 'a number' ||
        ty(y) !== 'a number')
      throw new Error(msg);
    return {
      '+': x + y, '-': x - y,
      '*': x * y, '/': x / y,
      '<': x < y, '>': x > y,
      '<=': x <= y, '>=': x >= y,
      '==': x === y, '!=': x !== y,
    }[k];
  };
  const run = (ss) => {
    for (const s of ss) {
      const k = s[0];
      if (k === 'let' || k === 'set')
        env.set(s[1], ev(s[2]));
      else if (k === 'return')
        return { value: ev(s[1]) };
      else {
        let r;
        if (k === 'if')
          r = run(ev(s[1])
            ? s[2] : s[3]);
        else while (!r && ev(s[1]))
          r = run(s[2]);
        if (r) return r;
      }
    }
  };
  return run(body).value;
}

// --- tiering: count calls, compile ---
function jit(fn, limit = 3) {
  let calls = 0, fast = null;
  const f = (...args) => {
    const ok = args.length ===
      fn[0].length && args.every(
        (a) => typeof a === 'number');
    if (!fast && ok &&
        ++calls === limit) {
      try { fast = compile(fn); }
      catch (e) { f.why = e.message; }
    }
    f.path = fast && ok
      ? 'compiled' : 'interpreted';
    return fast && ok ? fast(...args)
      : interp(fn, args);
  };
  return f;
}

// fn sumsq(n) { let s = 0; let i = 0;
//   while i < n { s += i * i; i += 1; }
//   return s; }
const v = (x) => ['var', x];
const sumsq = [['n'], [
  ['let', 's', ['num', 0]],
  ['let', 'i', ['num', 0]],
  ['while', ['<', v('i'), v('n')], [
    ['set', 's', ['+', v('s'),
      ['*', v('i'), v('i')]]],
    ['set', 'i', ['+', v('i'),
      ['num', 1]]],
  ]],
  ['return', v('s')],
]];

const f = jit(sumsq);
for (let k = 1; k <= 4; k++)
  console.log(k, f(4), f.path);
console.log(f(1000), f.path);
console.log(f(2.5), f.path);
try { f('4'); }
catch (e) { console.log(e.message); }`,
  },
};

export const exercises = {
  'emit-expr': {
    title: 'Compile an expression to stack code',
    prompt: 'Write `emit(e, out)`, which pushes the WebAssembly bytes for an expression tree onto the array `out`. A tree is `[\'num\', k]` (emit `0x44` and the 8 bytes of `f64(k)`), `[\'var\', slot]` (emit `0x20` and the slot number), or `[op, left, right]` for `+ - * /` (look the opcode up in `OP`). The helper `run(e, args)` builds a module whose function body is your code, instantiates it and calls it, so you can try your trees.',
    starter: `const OP = { '+': 0xa0, '-': 0xa1,
  '*': 0xa2, '/': 0xa3 };
function f64(x) {
  const b = new Uint8Array(8);
  new DataView(b.buffer)
    .setFloat64(0, x, true);
  return [...b];
}
// e: ['num', k], ['var', slot]
// or [op, left, right]
function emit(e, out) {
  // your code here
}

// run(e, args): compile e as the body
// of a function f, then call it
function run(e, args) {
  const code = [];
  emit(e, code);
  const n = args.length;
  const body = [0, ...code, 0x0b];
  const bytes = new Uint8Array([
    0, 0x61, 0x73, 0x6d, 1, 0, 0, 0,
    1, 5 + n, 1, 0x60, n,
    ...Array(n).fill(0x7c), 1, 0x7c,
    3, 2, 1, 0,
    7, 5, 1, 1, 0x66, 0, 0,
    10, body.length + 2, 1,
    body.length, ...body]);
  const W = WebAssembly;
  const m = new W.Module(bytes);
  const f = new W.Instance(m).exports.f;
  return f(...args);
}

const x = ['var', 0];
console.log(run(['*', x, x], [7]));`,
    solution: `const OP = { '+': 0xa0, '-': 0xa1,
  '*': 0xa2, '/': 0xa3 };
function f64(x) {
  const b = new Uint8Array(8);
  new DataView(b.buffer)
    .setFloat64(0, x, true);
  return [...b];
}
function emit(e, out) {
  const [k, a, b] = e;
  if (k === 'num') {
    out.push(0x44, ...f64(a));
  } else if (k === 'var') {
    out.push(0x20, a);
  } else {
    emit(a, out);
    emit(b, out);
    out.push(OP[k]);
  }
}

// run(e, args): compile e as the body
// of a function f, then call it
function run(e, args) {
  const code = [];
  emit(e, code);
  const n = args.length;
  const body = [0, ...code, 0x0b];
  const bytes = new Uint8Array([
    0, 0x61, 0x73, 0x6d, 1, 0, 0, 0,
    1, 5 + n, 1, 0x60, n,
    ...Array(n).fill(0x7c), 1, 0x7c,
    3, 2, 1, 0,
    7, 5, 1, 1, 0x66, 0, 0,
    10, body.length + 2, 1,
    body.length, ...body]);
  const W = WebAssembly;
  const m = new W.Module(bytes);
  const f = new W.Instance(m).exports.f;
  return f(...args);
}`,
    tests: `const x = ['var', 0];
test('x * x is get, get, mul', () => {
  const out = [];
  emit(['*', x, x], out);
  expect(out)
    .toEqual([0x20, 0, 0x20, 0, 0xa2]);
});
test('a constant is 0x44 and 8 bytes', () => {
  const out = [];
  emit(['num', 1], out);
  expect(out).toEqual([0x44,
    0, 0, 0, 0, 0, 0, 0xf0, 0x3f]);
});
test('a constant runs', () => {
  expect(run(['num', 2.5], [])).toBe(2.5);
});
test('a parameter runs', () => {
  expect(run(['var', 1], [3, 4])).toBe(4);
});
test('x + 1 with x = 41 is 42', () => {
  expect(run(['+', x, ['num', 1]], [41]))
    .toBe(42);
});
test('order matters: 10 - 4 is 6', () => {
  expect(run(['-', ['num', 10],
    ['num', 4]], [])).toBe(6);
});
test('nested: x * x - x / 2', () => {
  const e = ['-', ['*', x, x],
    ['/', x, ['num', 2]]];
  expect(run(e, [6])).toBe(33);
});`,
    hints: [
      'A tree is either a leaf (a number or a variable) or an operator with two subtrees. How does the interpreter evaluate an operator? It evaluates both children first.',
      'For a leaf, push the opcode and its operand. For an operator, call `emit` on the left child, then on the right child, then push `OP[op]`.',
      '`const [k, a, b] = e;` then three cases: `k === \'num\'` pushes `0x44, ...f64(a)`; `k === \'var\'` pushes `0x20, a`; otherwise `emit(a, out); emit(b, out); out.push(OP[k]);`.',
    ],
    walkthrough: `**How to think about it.** On a stack machine an operator finds its operands already on the stack, so by the time \`f64.sub\` runs, the left value must have been pushed and then the right one on top of it. That decides the order for us: the code for the left subtree, then the code for the right subtree, then the operator. Because the subtrees are trees too, \`emit\` calls itself on them; the leaves stop the recursion. This is the same post-order walk as the one that printed a tree in Part III, with bytes in place of text.

**The solution, line by line.**

- \`const [k, a, b] = e;\` takes the tree apart: \`k\` is the kind (\`'num'\`, \`'var'\` or an operator), and \`a\` and \`b\` are whatever follows (a number, a slot, or two subtrees).
- \`if (k === 'num') { out.push(0x44, ...f64(a)); }\` emits \`f64.const\`: the opcode 0x44 and then the eight bytes of the number, little-endian, which is what \`f64\` returns. For 1 that is \`00 00 00 00 00 00 f0 3f\`.
- \`else if (k === 'var') { out.push(0x20, a); }\` emits \`local.get\` with the slot number. (The slot is one byte here; a real encoder would write it with \`uleb\`, which for slots below 128 is the same byte.)
- \`emit(a, out);\` emits the left subtree, leaving its value on the stack at run time.
- \`emit(b, out);\` emits the right subtree, whose value ends up on top.
- \`out.push(OP[k]);\` emits the operator, which pops the two and pushes the result.

For \`x * x - x / 2\` the bytes come out as: get x, get x, mul, get x, const 2, div, sub; with \`x = 6\` that is 36, then 3, then 33.

**Common wrong attempts.**

- Pushing the operator first (\`out.push(OP[k]); emit(a, out); emit(b, out);\`) is the order you would write the expression in prefix form, but the engine rejects the module: the operator would find an empty stack.
- Emitting the right child before the left gives the right answer for \`+\` and \`*\` and the wrong one for \`-\` and \`/\`: \`10 - 4\` comes out as \`-6\`.
- Forgetting the eight bytes after 0x44 leaves the engine reading the next opcodes as the number.`,
    wrong: [
      {
        code: `const OP = { '+': 0xa0, '-': 0xa1,
  '*': 0xa2, '/': 0xa3 };
function f64(x) {
  const b = new Uint8Array(8);
  new DataView(b.buffer)
    .setFloat64(0, x, true);
  return [...b];
}
function emit(e, out) {
  const [k, a, b] = e;
  if (k === 'num') {
    out.push(0x44, ...f64(a));
  } else if (k === 'var') {
    out.push(0x20, a);
  } else {
    emit(b, out);
    emit(a, out);
    out.push(OP[k]);
  }
}

// run(e, args): compile e as the body
// of a function f, then call it
function run(e, args) {
  const code = [];
  emit(e, code);
  const n = args.length;
  const body = [0, ...code, 0x0b];
  const bytes = new Uint8Array([
    0, 0x61, 0x73, 0x6d, 1, 0, 0, 0,
    1, 5 + n, 1, 0x60, n,
    ...Array(n).fill(0x7c), 1, 0x7c,
    3, 2, 1, 0,
    7, 5, 1, 1, 0x66, 0, 0,
    10, body.length + 2, 1,
    body.length, ...body]);
  const W = WebAssembly;
  const m = new W.Module(bytes);
  const f = new W.Instance(m).exports.f;
  return f(...args);
}`,
        why: 'The right child is pushed first, so the operator sees its operands swapped: `10 - 4` gives -6.',
      },
      {
        code: `const OP = { '+': 0xa0, '-': 0xa1,
  '*': 0xa2, '/': 0xa3 };
function f64(x) {
  const b = new Uint8Array(8);
  new DataView(b.buffer)
    .setFloat64(0, x, true);
  return [...b];
}
function emit(e, out) {
  const [k, a, b] = e;
  if (k === 'num') {
    out.push(0x44, ...f64(a));
  } else if (k === 'var') {
    out.push(0x20, a);
  } else {
    out.push(OP[k]);
    emit(a, out);
    emit(b, out);
  }
}

// run(e, args): compile e as the body
// of a function f, then call it
function run(e, args) {
  const code = [];
  emit(e, code);
  const n = args.length;
  const body = [0, ...code, 0x0b];
  const bytes = new Uint8Array([
    0, 0x61, 0x73, 0x6d, 1, 0, 0, 0,
    1, 5 + n, 1, 0x60, n,
    ...Array(n).fill(0x7c), 1, 0x7c,
    3, 2, 1, 0,
    7, 5, 1, 1, 0x66, 0, 0,
    10, body.length + 2, 1,
    body.length, ...body]);
  const W = WebAssembly;
  const m = new W.Module(bytes);
  const f = new W.Instance(m).exports.f;
  return f(...args);
}`,
        why: 'The operator comes before its operands, so it would pop from an empty stack; the engine refuses the module, and every test with an operator fails.',
      },
    ],
  },
  'tier-up': {
    optional: true,
    title: 'The counter and the guard',
    prompt: 'Write `tierUp(slow, compile, limit)`. It returns a function that, called with some arguments, runs `slow(...args)` until it has been called with all-number arguments `limit` times; on that call it calls `compile()` once, which returns a fast function (or throws, in which case it stays slow for good). From then on, calls whose arguments are all numbers use the fast function, and any other call uses `slow`. Calls with non-numbers never count.',
    starter: `function tierUp(slow, compile, limit) {
  return (...args) => slow(...args);
}`,
    solution: `function tierUp(slow, compile, limit) {
  let calls = 0, fast = null;
  return (...args) => {
    const ok = args.every(
      (a) => typeof a === 'number');
    if (!fast && ok &&
        ++calls === limit) {
      try { fast = compile(); }
      catch (e) { /* stay slow */ }
    }
    return fast && ok
      ? fast(...args) : slow(...args);
  };
}`,
    tests: `function setup(fail) {
  const log = [];
  const slow = (x) => {
    log.push('slow'); return x * 2;
  };
  const fast = (x) => {
    log.push('fast'); return x * 2;
  };
  let compiles = 0;
  const compile = () => {
    compiles++;
    if (fail) throw new Error('no');
    return fast;
  };
  const f = tierUp(slow, compile, 3);
  return { f, log, n: () => compiles };
}
test('slow, slow, then fast', () => {
  const { f, log } = setup();
  f(1); f(2); f(3); f(4);
  expect(log).toEqual(
    ['slow', 'slow', 'fast', 'fast']);
});
test('compiles exactly once', () => {
  const { f, n } = setup();
  for (let k = 0; k < 10; k++) f(k);
  expect(n()).toBe(1);
});
test('the answers are right', () => {
  const { f } = setup();
  expect([1, 2, 3, 4].map((x) => f(x)))
    .toEqual([2, 4, 6, 8]);
});
test('non-numbers go slow, uncounted', () => {
  const { f, log } = setup();
  f('a'); f(1); f('b'); f(2); f(3);
  f('c');
  expect(log).toEqual(['slow', 'slow',
    'slow', 'slow', 'fast', 'slow']);
});
test('a refused compile stays slow', () => {
  const { f, log, n } = setup(true);
  for (let k = 0; k < 6; k++) f(k);
  expect(n()).toBe(1);
  expect(log.includes('fast')).toBe(false);
});`,
    hints: [
      'You need two pieces of state that outlive each call: how many good calls there have been, and the fast function (if there is one yet). A closure keeps them.',
      'On each call: work out whether every argument is a number. If there is no fast function yet and the call is good, count it, and when the count reaches `limit`, try `compile()`.',
      'Count with `++calls === limit` so the compile happens exactly once, wrap it in `try { fast = compile(); } catch (e) {}`, then return `fast && ok ? fast(...args) : slow(...args)`.',
    ],
    walkthrough: `**How to think about it.** This is the wrapper from the chapter, without the compiler in it. It has to remember things between calls (a count and maybe a fast function), so it returns a closure over two variables. Each call then asks two questions: is this call safe for compiled code (are all arguments numbers?), and do we have compiled code yet? Counting only safe calls means a function that is always called with strings never wastes time being compiled.

**The solution, line by line.**

- \`let calls = 0, fast = null;\` is the state the returned function closes over: the number of good calls so far, and the compiled function once there is one.
- \`return (...args) => {\` returns the wrapper; \`...args\` collects however many arguments the call has.
- \`const ok = args.every((a) => typeof a === 'number');\` is the guard's test.
- \`if (!fast && ok && ++calls === limit) {\` counts a good call only while there is no fast version, and fires exactly once, on the call that reaches the limit. Because \`&&\` stops at the first false, a bad call never reaches \`++calls\`.
- \`try { fast = compile(); } catch (e) { /* stay slow */ }\` compiles; if the compiler refuses, \`fast\` stays \`null\`, and since \`calls\` has now passed \`limit\` the test can never fire again, so it is not retried.
- \`return fast && ok ? fast(...args) : slow(...args);\` sends good calls to the compiled code when it exists, and everything else to the interpreter.

**Common wrong attempts.**

- Using \`calls >= limit\` instead of \`=== limit\` calls \`compile\` again on every later call when it keeps failing.
- Counting before the guard (\`calls++\` on every call) lets calls with strings push the function into compiling.
- Checking \`fast\` but not \`ok\` on the way out sends a string to the compiled code, which in the real JIT would quietly convert it to a number.`,
    wrong: [
      {
        code: `function tierUp(slow, compile, limit) {
  let calls = 0, fast = null;
  return (...args) => {
    const ok = args.every(
      (a) => typeof a === 'number');
    if (!fast && ++calls >= limit) {
      try { fast = compile(); }
      catch (e) {}
    }
    return fast && ok
      ? fast(...args) : slow(...args);
  };
}`,
        why: 'Calls with strings are counted, and a refused compile is retried on every later call, because `>=` stays true.',
      },
      {
        code: `function tierUp(slow, compile, limit) {
  let calls = 0, fast = null;
  return (...args) => {
    const ok = args.every(
      (a) => typeof a === 'number');
    if (!fast && ok &&
        ++calls === limit) {
      fast = compile();
    }
    return fast
      ? fast(...args) : slow(...args);
  };
}`,
        why: 'A compile that throws is not caught, so the call fails; and once compiled, non-number arguments go to the fast function.',
      },
    ],
  },
};

export const quiz = [
  {
    q: 'What is the guard in the chapter’s JIT for?',
    options: [
      {
        t: 'To decide when a function is hot enough to compile.',
        why: 'That is the counter’s job.',
      },
      {
        t: 'To send a call to the compiled code only when the compiled code will behave exactly as the interpreter would.',
        correct: true,
        why: 'Right: wrong argument counts and non-numbers go to the interpreter, which reports Drip’s errors properly.',
      },
      {
        t: 'To check that the WebAssembly module is valid.',
        why: 'The engine does that when the module is made; the guard runs on every call.',
      },
    ],
  },
  {
    q: 'In which order does the compiler emit `n - i`, with n in local 0 and i in local 2?',
    options: [
      {
        t: '`f64.sub`, `local.get 0`, `local.get 2`',
        why: 'The operator would run before its operands were on the stack; the engine rejects this.',
      },
      {
        t: '`local.get 2`, `local.get 0`, `f64.sub`',
        why: 'This computes i − n: the value pushed first is the left operand.',
      },
      {
        t: '`local.get 0`, `local.get 2`, `f64.sub`',
        correct: true,
        why: 'Right: left operand, right operand, then the operator, which pops both.',
      },
    ],
  },
  {
    q: 'Why does the JIT refuse `while n { n -= 1; }` even though it could compile it?',
    options: [
      {
        t: 'In Drip every number is truthy, so this loop never ends; a compiled "loop while n is not 0" would end at 0 and change what the program does.',
        correct: true,
        why: 'Right: the JIT must keep Drip’s meaning, so it only compiles conditions that are comparisons.',
      },
      {
        t: 'WebAssembly cannot compare a float with zero.',
        why: 'It can (f64.ne with a constant 0); the problem is Drip’s truthiness, not WebAssembly.',
      },
      {
        t: 'Loops cannot be compiled to WebAssembly.',
        why: 'They can, as block, loop and br_if; the chapter compiles sumsq’s loop.',
      },
    ],
  },
  {
    q: '`sumsq(2.5)` returns 5 in the interpreter. What does the compiled version return, and why?',
    options: [
      {
        t: '5, because WebAssembly’s f64 is the same 64-bit float as Drip’s numbers, with the same arithmetic.',
        correct: true,
        why: 'Right: the loop adds 0, 1 and 4, exactly as the interpreter does.',
      },
      {
        t: '14, because the compiled code rounds 2.5 up to 3.',
        why: 'Nothing rounds: the parameter is an f64.',
      },
      {
        t: 'An error, because 2.5 is not a whole number.',
        why: 'Drip has no separate whole-number type; 2.5 is an ordinary number on both paths.',
      },
    ],
  },
  {
    q: 'What does V8’s Liftoff do with the module our JIT hands it?',
    options: [
      {
        t: 'It interprets the bytes one at a time.',
        why: 'Liftoff is a compiler, not an interpreter; V8 found a WebAssembly interpreter far too slow except for debugging.',
      },
      {
        t: 'It compiles each function to machine code in one quick pass, tracking where each stack value lives; TurboFan can recompile hot code later.',
        correct: true,
        why: 'Right: a baseline tier first, then an optimising tier, as for JavaScript.',
      },
      {
        t: 'It sends the bytes back to JavaScript for checking.',
        why: 'Checking (validation) is done by the engine itself.',
      },
    ],
  },
  {
    q: 'Which is a real difference between this JIT and a speculating JIT such as V8’s TurboFan?',
    options: [
      {
        t: 'This JIT produces machine code and TurboFan does not.',
        why: 'Both end in machine code; ours goes through WebAssembly and the engine.',
      },
      {
        t: 'This JIT checks the arguments before the call; a speculating JIT checks its guesses inside the compiled code and can deoptimise halfway through.',
        correct: true,
        why: 'Right: that is what lets a speculating JIT compile code whose types it can only guess.',
      },
      {
        t: 'TurboFan never falls back to the interpreter.',
        why: 'It does: that is deoptimisation (chapter 88).',
      },
    ],
  },
];
