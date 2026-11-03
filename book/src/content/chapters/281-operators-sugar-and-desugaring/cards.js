// Cards for Operators, sugar and desugaring: recall prompts, examples, exercises and quiz.
// Keys are stable ids: renaming one would orphan readers' review history.

export const prompts = {
  'op-what': {
    q: 'What is operator overloading?',
    a: 'Letting a program define what an operator such as `+` or `==` means for its own types.',
  },
  'op-sugar': {
    q: 'What does a compiler turn `p + q` into when `p` and `q` are values of a user-defined type?',
    a: 'A call of the function the program defined for `+` on those types (an `operator+`, an `Add::add`, an `__add__`).',
  },
  'op-when': {
    q: 'When is the operator function chosen in C++ and Rust, and when in Python?',
    a: 'C++ and Rust: while compiling, from the operand types. Python: while running, from the types of the actual values.',
  },
  'op-cpp': {
    q: 'In `nm` output, what is `_Zpl1VS_`?',
    a: 'The mangled name of `operator+(V, V)`: `pl` is the code for `+`, `1V` the first parameter type, and `S_` refers back to `V` for the second.',
  },
  'op-rust': {
    q: 'In rustc’s MIR, what has `p + q` become for a struct `V` that implements `Add`?',
    a: 'A call `<V as Add>::add(p, q)`: the `add` method of the `Add` trait for `V`.',
  },
  'op-py': {
    q: 'In what order does Python try methods for `a + b`?',
    a: '`type(a).__add__(a, b)` first; if missing or `NotImplemented` (and the types differ), `type(b).__radd__(b, a)`; if that declines too, `TypeError`.',
  },
  'op-notimpl': {
    q: 'What does it mean when `__add__` returns `NotImplemented`?',
    a: '"I cannot add this": Python then asks the other operand’s reflected method instead of failing at once.',
  },
  'op-once': {
    q: 'In JavaScript, why is `xs[pick()] += 5` not the same as `xs[pick()] = xs[pick()] + 5`?',
    a: 'The first works out its target once, so `pick()` runs once; the second calls `pick()` twice. A correct desugaring of `+=` must evaluate the target only once.',
  },
  'op-java': {
    q: 'Java has no operator overloading. What does javac 21 compile `s + n` (a string plus an int) into?',
    a: 'An `invokedynamic` call, `makeConcatWithConstants`, into the Java library: the `+` is still desugared into a call.',
  },
};

export const examples = {
  'plus-once': {
    title: '+= works out its target once',
    lang: 'drip',
    code: `let calls = 0;
fn pick() {
  calls += 1;
  return 0;
}
let xs = [10, 20];
xs[pick()] += 5;
print xs;
print calls;
xs[pick()] = xs[pick()] + 5;
print xs;
print calls;`,
  },
  'lower-ops': {
    title: 'Choosing an operator function by type',
    code: `// operator functions the program
// defined, keyed by operand types
const ops = {
  '+ V V': 'call _Zpl1VS_',
  '== V V': 'call _Zeq1VS_',
};
const builtin = { '+ int int': 'add' };
function lower(op, ta, tb) {
  const key = op + ' ' + ta + ' ' + tb;
  if (key in builtin) {
    return builtin[key];
  }
  if (key in ops) return ops[key];
  throw new Error('no operator ' + key);
}
console.log(lower('+', 'int', 'int'));
console.log(lower('+', 'V', 'V'));
console.log(lower('==', 'V', 'V'));
try {
  lower('+', 'V', 'int');
} catch (e) {
  console.log(e.message);
}`,
  },
};

export const exercises = {
  'py-add': {
    title: 'Python’s + in JavaScript',
    prompt: 'Write `pyAdd(a, b)`, which does what Python does for `a + b`. Two numbers are added directly. Otherwise: if `a` has a method `__add__`, call `a.__add__(b)` and return its result unless it is `NotImplemented`; then, **if the two values have different type names**, try `b.__radd__(a)` the same way; if neither produced a result, throw a `TypeError` with the message `unsupported operand type(s) for +: \'A\' and \'B\'`, where A and B come from `typeName` (given, with `NotImplemented`).',
    starter: `const NotImplemented = {};
function typeName(x) {
  return typeof x === 'object'
    ? x.constructor.name
    : typeof x;
}
function pyAdd(a, b) {
  return a + b;
}`,
    solution: `const NotImplemented = {};
function typeName(x) {
  return typeof x === 'object'
    ? x.constructor.name
    : typeof x;
}
function pyAdd(a, b) {
  if (typeof a === 'number'
    && typeof b === 'number') {
    return a + b;
  }
  if (a.__add__) {
    const r = a.__add__(b);
    if (r !== NotImplemented) return r;
  }
  const ta = typeName(a);
  const tb = typeName(b);
  if (ta !== tb && b.__radd__) {
    const r = b.__radd__(a);
    if (r !== NotImplemented) return r;
  }
  throw new TypeError('unsupported '
    + 'operand type(s) for +: '
    + \`'\${ta}' and '\${tb}'\`);
}`,
    tests: `class V {
  constructor(x) { this.x = x; }
  __add__(o) {
    return o instanceof V
      ? new V(this.x + o.x) : NotImplemented;
  }
  __radd__(o) {
    return typeof o === 'number'
      ? new V(o + this.x) : NotImplemented;
  }
}
class W {
  __add__() { return NotImplemented; }
  __radd__() { return 'reflected'; }
}
const err = (f) => {
  try { f(); return 'no error'; }
  catch (e) {
    return e.constructor.name + ': ' + e.message;
  }
};
const msg = (a, b) => 'TypeError: unsupported '
  + "operand type(s) for +: '" + a + "' and '"
  + b + "'";
test('two numbers', () => {
  expect(pyAdd(2, 3)).toBe(5);
});
test('V + V uses __add__', () => {
  expect(pyAdd(new V(1), new V(2)).x).toBe(3);
});
test('5 + V falls back to __radd__', () => {
  expect(pyAdd(5, new V(1)).x).toBe(6);
});
test('V + 5: both sides decline', () => {
  expect(err(() => pyAdd(new V(1), 5)))
    .toBe(msg('V', 'number'));
});
test('V + a string', () => {
  expect(err(() => pyAdd(new V(1), 'a')))
    .toBe(msg('V', 'string'));
});
test('different types: __radd__ is asked', () => {
  expect(pyAdd(new V(1), new W())).toBe('reflected');
});
test('same type: __radd__ is not asked', () => {
  expect(err(() => pyAdd(new W(), new W())))
    .toBe(msg('W', 'W'));
});`,
    hints: [
      'Follow the steps in order, and let each step return as soon as it has an answer; whatever falls through to the end is an error.',
      'A method is "missing" if `a.__add__` is `undefined`. A method can also be present but decline, by returning `NotImplemented`; compare with `!==`, since `NotImplemented` is one particular object.',
      'Compute `ta = typeName(a)` and `tb = typeName(b)`. Try `b.__radd__(a)` only when `ta !== tb`. End with `throw new TypeError(...)` built from `ta` and `tb`.',
    ],
    walkthrough: `**How to think about it.** Python's rule is a short procedure with three exits: the left operand's \`__add__\` answers, or the right operand's \`__radd__\` answers, or nobody does and it is an error. Two details make it more than "call a method". A method can exist and still *decline*, by returning the special value \`NotImplemented\`, which means "ask someone else", not "the answer is NotImplemented". And the reflected method is only tried when the two values have different types, because if both are the same type and its \`__add__\` declined, asking the same type again with the operands swapped would be pointless (this is the data model's rule, quoted in the chapter).

**The solution, line by line.**

- \`const NotImplemented = {};\` (given) is one unique object; nothing else is \`===\` to it, which is what makes it usable as a signal.
- \`function typeName(x) { ... }\` (given) names a value's type: an object's class name, or \`typeof\` for a primitive.
- \`if (typeof a === 'number' && typeof b === 'number') { return a + b; }\` (four lines): built-in numbers add directly, the way Python's \`int\` handles \`2 + 3\` itself.
- \`if (a.__add__) {\` asks whether the left value has an \`__add__\` method at all. For the number \`5\`, \`(5).__add__\` is \`undefined\`, so \`5 + V(1)\` skips this step, which matches Python's result, where \`int.__add__\` declines.
- \`const r = a.__add__(b); if (r !== NotImplemented) return r;\` calls it and returns any real answer: \`V(1) + V(2)\` gives \`V(3)\` here.
- \`const ta = typeName(a); const tb = typeName(b);\` are needed for the rule and for the message.
- \`if (ta !== tb && b.__radd__) {\` only for different types, and only if the right value has the reflected method.
- \`const r = b.__radd__(a); if (r !== NotImplemented) return r;\` note the order of arguments: the method belongs to \`b\`, and it is handed \`a\`, the value that was on the left. \`5 + V(1)\` becomes \`V(1).__radd__(5)\`, which is \`V(6)\`.
- \`throw new TypeError('unsupported ' + 'operand type(s) for +: ' + ...)\` (three lines) is reached only if both sides declined or were missing, with Python's exact wording.

**Common wrong attempts.**

- Returning whatever \`__add__\` returns, without checking for \`NotImplemented\`, hands the signal object back to the caller as if it were a sum.
- Always trying \`__radd__\`: then \`W() + W()\` returns \`'reflected'\`, but Python never asks the same type twice.
- Calling \`b.__radd__(b, a)\` or \`a.__radd__(b)\`: a method call already passes its object as \`this\`, and the reflected method is the *right* operand's.`,
    wrong: [
      {
        code: `const NotImplemented = {};
function typeName(x) {
  return typeof x === 'object'
    ? x.constructor.name
    : typeof x;
}
function pyAdd(a, b) {
  if (typeof a === 'number'
    && typeof b === 'number') {
    return a + b;
  }
  if (a.__add__) return a.__add__(b);
  if (b.__radd__) return b.__radd__(a);
  throw new TypeError('unsupported');
}`,
        why: 'It returns `NotImplemented` itself instead of treating it as "ask the other side", and its error message is not Python’s.',
      },
      {
        code: `const NotImplemented = {};
function typeName(x) {
  return typeof x === 'object'
    ? x.constructor.name
    : typeof x;
}
function pyAdd(a, b) {
  if (typeof a === 'number'
    && typeof b === 'number') {
    return a + b;
  }
  for (const r of [
    a.__add__ && a.__add__(b),
    b.__radd__ && b.__radd__(a),
  ]) {
    if (r && r !== NotImplemented) {
      return r;
    }
  }
  throw new TypeError('unsupported '
    + 'operand type(s) for +: '
    + \`'\${typeName(a)}' and \`
    + \`'\${typeName(b)}'\`);
}`,
        why: 'It always asks `__radd__`, even when both operands have the same type, so `W() + W()` returns `\'reflected\'` instead of raising.',
      },
    ],
  },
};

export const quiz = [
  {
    q: 'In C++, `p + q` for two values of a struct `V` with an `operator+` compiles (at -O0) to what?',
    options: [
      {
        t: 'A call of the function `_Zpl1VS_`, which is `operator+(V, V)`',
        correct: true,
        why: 'The operator is desugared into an ordinary, mangled function call, chosen from the types.',
      },
      {
        t: 'A machine instruction that adds two structs',
        why: 'There is no such instruction; the program supplied the meaning.',
      },
      {
        t: 'A run-time lookup of `+` on the object',
        why: 'C++ chooses the function while compiling; there is nothing to look up at run time.',
      },
    ],
  },
  {
    q: 'What does Python 3.13 compile `a + b` to, whatever the types of `a` and `b`?',
    options: [
      {
        t: 'A call of `a.__add__(b)`',
        why: 'The bytecode does not name a method; the choice is made when it runs.',
      },
      {
        t: 'The single instruction `BINARY_OP 0 (+)`',
        correct: true,
        why: 'dis shows one instruction; at run time it finds `__add__` or `__radd__` from the values’ types.',
      },
      {
        t: 'Different instructions for numbers and for objects',
        why: 'Python does not know the types while compiling, so it emits the same instruction.',
      },
    ],
  },
  {
    q: 'In Python, a class `V` defines `__add__` and `__radd__`. Why does `5 + V(1)` work, although `int` knows nothing about `V`?',
    options: [
      {
        t: '`int.__add__` converts `V(1)` to a number',
        why: 'It cannot; it returns `NotImplemented`.',
      },
      {
        t: 'Python swaps the operands of every `+`',
        why: 'Only after the left side declines does it try the right side’s reflected method.',
      },
      {
        t: '`int.__add__` returns `NotImplemented`, so Python calls `V.__radd__(V(1), 5)`',
        correct: true,
        why: 'The reflected method handles a number on its left and returns `V(6)`.',
      },
      {
        t: 'V inherits from int',
        why: 'It does not; it only defines `__radd__`.',
      },
    ],
  },
  {
    q: 'Why can a C++ or Rust compiler inline an overloaded `+`, while Python cannot do the same in its compiler?',
    options: [
      {
        t: 'C++ and Rust choose the function from the types while compiling, so the call target is known',
        correct: true,
        why: 'A known, static call can be inlined like any other; Python learns the types only while running.',
      },
      {
        t: 'Python forbids inlining by its language rules',
        why: 'It is a matter of what is known when, not a rule.',
      },
      {
        t: 'C++ and Rust operators are not really functions',
        why: 'They are: nm shows `operator+` as a function, and MIR shows `Add::add`.',
      },
    ],
  },
  {
    q: 'Which of these languages lets a program define `+` for its own classes?',
    options: [
      {
        t: 'Java',
        why: 'Java has no user-defined operators; only the built-in string `+` is special.',
      },
      {
        t: 'JavaScript',
        why: 'JavaScript does not let classes define `+`.',
      },
      {
        t: 'C',
        why: 'C has no operator overloading (or overloading of any kind).',
      },
      {
        t: 'Python',
        correct: true,
        why: 'With `__add__` and `__radd__`, as the data model describes.',
      },
    ],
  },
];
