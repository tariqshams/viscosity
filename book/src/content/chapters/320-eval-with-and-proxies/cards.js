// Chapter 320 cards. Keys are stable ids: never rename them.

export const prompts = {
  'ev-what': {
    q: 'What does a **direct** `eval(s)` do that an ordinary function call cannot?',
    a: 'It runs the string `s` as code inside the caller\'s scope, so it can read and change the caller\'s local variables.',
  },
  'ev-direct': {
    q: 'Which of `eval(s)`, `(0, eval)(s)` and `globalThis.eval(s)` is a direct eval?',
    a: 'Only `eval(s)`: a plain call through the name `eval` that finds the real `%eval%`. The others are indirect and run in the global scope.',
  },
  'ev-resolver': {
    q: 'Why does a direct `eval` defeat the resolver of chapter 110?',
    a: 'The resolver must know at compile time which declaration every name refers to; the string passed to eval is only known at run time and may read, change or (outside strict mode) declare any name.',
  },
  'ev-v8': {
    q: 'Where does V8 keep a local variable in a function that contains a direct `eval`?',
    a: 'In a heap-allocated context slot (`StaCurrentContextSlot`) rather than a register, so the eval\'d code can find it by name.',
  },
  'ev-with': {
    q: 'What does `with (o) { x + 1 }` force the engine to do for `x`?',
    a: 'Look `x` up by name at run time (`LdaLookupSlot`), because `x` may be a property of `o` or the variable outside, and that can change on every run.',
  },
  'ev-strict': {
    q: 'What does strict mode change about `eval` and `with`?',
    a: 'A strict direct eval puts its declarations in a new scope of its own, and `with` is a syntax error.',
  },
  'px-what': {
    q: 'What is a **proxy**?',
    a: 'An object whose basic operations (property read, write, `in`, delete, call, construct...) are intercepted by functions called traps.',
  },
  'px-forward': {
    q: 'What happens to an operation on a proxy whose handler has no trap for it?',
    a: 'It is forwarded to the target unchanged.',
  },
  'px-invariant': {
    q: 'Give one invariant a `get` trap must respect.',
    a: 'If the target\'s own property is non-configurable and non-writable, the trap must return its actual value, or the read throws a TypeError.',
  },
  'px-other': {
    q: 'What are the nearest equivalents of a JavaScript Proxy in Java and Python?',
    a: 'Java\'s `java.lang.reflect.Proxy` with an `InvocationHandler` (for interfaces), and Python\'s `__getattr__` (for missing attributes) or `__getattribute__`.',
  },
};

export const examples = {
  proxies: {
    title: 'Three proxies',
    code: `// 1. Log every read, then forward it.
const p = { x: 3, y: 4 };
const logged = new Proxy(p, {
  get(t, key, recv) {
    console.log('read', String(key));
    return Reflect.get(t, key, recv);
  },
});
console.log(logged.x + logged.y);

// 2. Arrays that accept xs[-1].
function wrap(xs) {
  return new Proxy(xs, {
    get(t, k, r) {
      const i = Number(k);
      if (Number.isInteger(i) && i < 0)
        k = String(t.length + i);
      return Reflect.get(t, k, r);
    },
  });
}
console.log(wrap([10, 20, 30])[-1]);

// 3. A trap may not lie about a frozen
//    property.
const frozen = Object.freeze({ id: 1 });
const liar = new Proxy(frozen, {
  get: () => 2,
});
try {
  liar.id;
} catch (e) {
  console.log(e.constructor.name);
}`,
  },
};

export const exercises = {
  proxyget: {
    title: 'A proxy\'s [[Get]]',
    prompt:
      'In a small object model, a proxy is `{ isProxy: true, target, handler }`; any other object is plain. Write `get(o, key)`, following the specification: for a plain object return `o[key]`. For a proxy, look up `handler.get`; if it is `undefined`, forward the read to the target (which may itself be a proxy). Otherwise call `trap(target, key)`. Then check the invariant: if the target has an own property `key` that is non-configurable and non-writable, and `Object.is(result, value)` is false, throw a `TypeError`. Otherwise return the result.',
    starter: `function get(o, key) {
  return o[key];
}`,
    solution: `function get(o, key) {
  if (!o.isProxy) return o[key];
  const trap = o.handler.get;
  if (trap === undefined)
    return get(o.target, key);
  const r = trap(o.target, key);
  const own = Object
    .getOwnPropertyDescriptor;
  const d = own(o.target, key);
  if (d && !d.configurable &&
    d.writable === false &&
    !Object.is(r, d.value))
    throw new TypeError('invariant');
  return r;
}`,
    tests: `const P = (target, handler) =>
  ({ isProxy: true, target, handler });
test('plain objects read normally', () => {
  expect(get({ x: 1 }, 'x')).toBe(1);
});
test('no trap forwards to the target', () => {
  expect(get(P({ x: 1 }, {}), 'x')).toBe(1);
});
test('forwarding goes through proxies', () => {
  const inner = P({ x: 2 }, {});
  expect(get(P(inner, {}), 'x')).toBe(2);
});
test('the trap decides', () => {
  const h = { get: (t, k) => k + '!' };
  expect(get(P({}, h), 'hi')).toBe('hi!');
});
test('a trap may not lie about a fixed property', () => {
  const t = Object.freeze({ id: 1 });
  const lie = P(t, { get: () => 2 });
  expect(() => get(lie, 'id')).toThrow();
  const honest = P(t, { get: () => 1 });
  expect(get(honest, 'id')).toBe(1);
});
test('ordinary properties may be changed', () => {
  const p = P({ n: 5 }, { get: () => 50 });
  expect(get(p, 'n')).toBe(50);
});`,
    hints: [
      'Handle the plain case first and return early. For a proxy you need three things in order: find the trap, call it (or forward), check the result.',
      'Forwarding is a recursive call: `get(o.target, key)`, so a proxy of a proxy works. To check the invariant, read the target\'s own descriptor with `Object.getOwnPropertyDescriptor(o.target, key)`.',
      'The read is refused when `d && !d.configurable && d.writable === false && !Object.is(r, d.value)`. Use `d.writable === false` (not `!d.writable`) so that accessor properties, which have no `writable`, are not caught by this rule.',
    ],
    walkthrough: `**How to think about it.** The specification's algorithm for a proxy's [[Get]] is short, and the whole job is to follow it in order: find the trap, call it or forward, then check that the trap did not break a promise the target made. A plain object is the base case. Writing it yourself shows where the cost of proxies comes from: every read is now a function call plus a descriptor check, where a plain object needed one load.

**The solution, line by line.**

- \`if (!o.isProxy) return o[key];\` is the ordinary case: a plain read.
- \`const trap = o.handler.get;\` looks the trap up on the handler, as the spec's GetMethod(handler, "get") does.
- \`if (trap === undefined) return get(o.target, key);\` (over two lines) forwards when there is no trap. It calls \`get\` again rather than \`o.target[key]\`, so a proxy whose target is a proxy works too.
- \`const r = trap(o.target, key);\` calls the trap with the target and the key (the real API also passes the receiver).
- \`const own = Object.getOwnPropertyDescriptor;\` (over two lines) and \`const d = own(o.target, key);\` read the target's own property descriptor, or \`undefined\` if it has none.
- The \`if\` checks the invariant: the property exists (\`d\`), cannot be reconfigured (\`!d.configurable\`), is a data property that cannot be written (\`d.writable === false\`), and the trap's answer differs from its value. \`Object.is\` is the spec's SameValue, which treats \`NaN\` as equal to itself.
- \`throw new TypeError('invariant');\` refuses the lie.
- \`return r;\` returns what the trap said otherwise: a proxy may report anything for ordinary properties.

**Common wrong attempts.**

- Calling the trap and returning its result with no check: the frozen \`id\` test sees \`2\` instead of an error.
- Forwarding with \`o.target[key]\`: a proxy of a proxy returns the inner proxy's own field (\`undefined\` here) instead of going through it.
- Checking with \`!==\` instead of \`Object.is\`: it works for these tests, but \`NaN !== NaN\` would reject an honest trap on a frozen \`NaN\`.`,
    wrong: [
      {
        code: `function get(o, key) {
  if (!o.isProxy) return o[key];
  const trap = o.handler.get;
  if (trap === undefined)
    return o.target[key];
  return trap(o.target, key);
}`,
        why: 'No invariant check, so the trap can lie about a frozen property; and forwarding reads the inner proxy\'s own fields instead of going through it.',
      },
    ],
  },
};

export const quiz = [
  {
    q: 'In `function f() { let x = 1; eval(s); return x; }`, why can V8 not keep `x` in a register?',
    options: [
      { t: 'Because `x` is declared with `let`', why: 'The same function without the eval keeps `x` in a register.' },
      { t: 'Because the string `s`, known only at run time, may read or assign `x` by name', correct: true, why: 'So `x` goes into a heap context slot that the eval\'d code can reach.' },
      { t: 'Because `eval` is slow to call', why: 'Its speed is a separate matter; the issue is what the code in `s` can reach.' },
    ],
  },
  {
    q: 'Which call is an **indirect** eval, running in the global scope?',
    options: [
      { t: '`eval(code)`', why: 'A plain call through the name `eval` is the direct form.' },
      { t: '`(0, eval)(code)`', correct: true, why: 'The comma expression produces the function as a value, not a reference named `eval`, so the spec\'s direct-eval step does not apply.' },
      { t: 'Both', why: 'Only the second is indirect.' },
    ],
  },
  {
    q: 'Why does `with (o) { return x + 1; }` compile to `LdaLookupSlot` for `x`?',
    options: [
      { t: 'Because `x` might be a property of `o`, and which one wins is only known at run time', correct: true, why: 'The spec says `with` adds an object environment for `o`, searched before the outer scope.' },
      { t: 'Because `with` makes `x` global', why: 'It does not; it puts `o`\'s properties in front of the existing scope.' },
      { t: 'Because strict mode requires it', why: '`with` is a syntax error in strict mode.' },
    ],
  },
  {
    q: 'A proxy\'s handler has a `set` trap but no `get` trap. What does `p.x` do?',
    options: [
      { t: 'Throws, because the handler is incomplete', why: 'Missing traps are allowed.' },
      { t: 'Returns `undefined`', why: 'Only if the target has no `x`.' },
      { t: 'Reads `x` from the target, unchanged', correct: true, why: 'With no trap, [[Get]] forwards to the target.' },
    ],
  },
  {
    q: 'Which of these could a proxy\'s `get` trap **not** get away with?',
    options: [
      { t: 'Returning the last element when an array is read with the key `"-1"`', why: 'The array has no own property `"-1"`, so no invariant applies: this is the `wrap` example.' },
      { t: 'Returning 2 for a property the target defined as non-writable and non-configurable with value 1', correct: true, why: 'That breaks an invariant, and the read throws a TypeError.' },
      { t: 'Logging every read', why: 'Side effects in traps are allowed.' },
    ],
  },
];
