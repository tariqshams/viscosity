// A tiny JIT: cards: recall prompts, examples, exercises and quiz.
// Keys are stable ids: renaming one would orphan readers' review history.

export const prompts = {
  'rcg-what': {
    q: 'What is **runtime code generation**?',
    a: 'A program producing new executable code while it runs (as source text, WebAssembly or raw machine code) and then running it.',
  },
  'new-function-risk': {
    q: 'Why is `new Function(body)` risky when `body` comes from a user?',
    a: 'The string is compiled and run as code, so whoever controls the string controls what runs (the same risk as `eval`).',
  },
  'wx-why': {
    q: 'What does **W^X** forbid, and why?',
    a: 'A page being writable and executable at the same moment; so that bytes an attacker manages to write can never then be run.',
  },
  'wx-order': {
    q: 'A native JIT on Linux follows W^X with a single mapping. In what order does it prepare a page of new code?',
    a: 'Map it read+write, write the machine code, mprotect it to read+execute, flush the instruction cache, then call it.',
  },
  'fence-i': {
    q: 'Why does a RISC-V JIT need `fence.i` (or `__builtin___clear_cache`) after writing code?',
    a: 'Instruction fetches may not yet see the stores that wrote the code; fence.i is the standard way to make them visible to the same hart.',
  },
  'wasm-why': {
    q: 'Why does a JIT written in JavaScript emit WebAssembly rather than machine code?',
    a: 'JavaScript cannot get executable memory; it can hand WebAssembly bytes to the engine, which checks and compiles them.',
  },
  'section-shape': {
    q: 'What three things make up every WebAssembly section?',
    a: 'A one-byte id, the size of the contents (in LEB128), and the contents.',
  },
  'to-number': {
    q: 'An export takes an f64. What happens if JavaScript calls it with the string `"7"`?',
    a: 'The argument goes through ToNumber, so it quietly becomes 7; no error.',
  },
  'leb-128': {
    q: 'How is 300 written in unsigned LEB128?',
    a: '`ac 02`: the low seven bits (44) plus 128 for "more follows" is 0xac, then 300 >> 7 = 2.',
  },
};

export const examples = {
  'by-hand': {
    title: 'A WebAssembly module, byte by byte',
    code: `// fn sq(x) { return x * x; }
const bytes = new Uint8Array([
  // "\\0asm", then version 1
  0x00, 0x61, 0x73, 0x6d,
  0x01, 0x00, 0x00, 0x00,
  // type section: (f64) -> f64
  0x01, 0x06, 0x01,
  0x60, 0x01, 0x7c, 0x01, 0x7c,
  // function section: fn 0 has type 0
  0x03, 0x02, 0x01, 0x00,
  // export section: "sq" is fn 0
  0x07, 0x06, 0x01,
  0x02, 0x73, 0x71, 0x00, 0x00,
  // code section: one body of 7 bytes
  0x0a, 0x09, 0x01, 0x07,
  0x00,       // no extra locals
  0x20, 0x00, // local.get 0
  0x20, 0x00, // local.get 0
  0xa2,       // f64.mul
  0x0b,       // end
]);

const W = WebAssembly;
const mod = new W.Module(bytes);
const inst = new W.Instance(mod);
const sq = inst.exports.sq;
console.log(sq(7));
console.log(sq(1.5));
console.log(bytes.length, 'bytes');`,
  },
};

export const exercises = {
  uleb: {
    title: 'Encode a size in LEB128',
    prompt: 'Write `uleb(n)`, which returns the unsigned LEB128 bytes of a whole number `n` (0 up to 2³² − 1) as an array of numbers. Seven bits go in each byte, lowest group first; every byte except the last has its top bit (128) set. For example `uleb(300)` is `[0xac, 0x02]`. The last test builds a real module with your sizes and asks the engine whether it is valid.',
    starter: `function uleb(n) {
  // one byte per 7 bits, lowest first;
  // set 0x80 on all but the last
  return [n];
}

console.log(uleb(300));`,
    solution: `function uleb(n) {
  const out = [];
  do {
    let b = n & 0x7f;
    n >>>= 7;
    if (n !== 0) b |= 0x80;
    out.push(b);
  } while (n !== 0);
  return out;
}`,
    tests: `test('small numbers are one byte', () => {
  expect(uleb(0)).toEqual([0]);
  expect(uleb(5)).toEqual([5]);
  expect(uleb(127)).toEqual([127]);
});
test('128 needs two bytes', () => {
  expect(uleb(128)).toEqual([0x80, 0x01]);
});
test('300 is ac 02', () => {
  expect(uleb(300)).toEqual([0xac, 0x02]);
});
test('624485 is e5 8e 26', () => {
  expect(uleb(624485))
    .toEqual([0xe5, 0x8e, 0x26]);
});
test('a section size the engine accepts', () => {
  // a custom section (id 0) whose size
  // is 200: 1 name-length byte, a
  // 1-byte name, then 198 bytes of data
  const body = [1, 0x78,
    ...new Array(198).fill(0)];
  const bytes = new Uint8Array([
    0, 0x61, 0x73, 0x6d, 1, 0, 0, 0,
    0, ...uleb(body.length), ...body]);
  expect(WebAssembly.validate(bytes))
    .toBe(true);
});`,
    hints: [
      'Work 300 out by hand first: what is 300 % 128, and what is left after you divide by 128?',
      'Loop: take the low seven bits with `n & 0x7f`, then shift them away with `n >>>= 7`. If anything is left, this byte is not the last one.',
      'Inside a `do { ... } while (n !== 0)` loop: `let b = n & 0x7f; n >>>= 7; if (n !== 0) b |= 0x80; out.push(b);`. The `do` makes sure 0 still produces one byte.',
    ],
    walkthrough: `**How to think about it.** LEB128 writes a number in base 128, one digit per byte, lowest digit first. Every byte can hold 8 bits, but only 7 carry the digit; the eighth, the top bit (worth 128), is a flag that says "there is another byte after me". So the job is a loop that peels off seven bits at a time, and for each one decides whether more are coming. Try 300 by hand: 300 = 2 × 128 + 44, so the digits are 44 then 2; the first byte is 44 + 128 = 172 (0xac) because the 2 follows, and the last byte is 2. That is \`[0xac, 0x02]\`.

**The solution, line by line.**

- \`const out = [];\` collects the bytes in the order they will be written.
- \`do {\` starts a loop that always runs at least once. That matters for 0: it must still produce one byte, \`[0]\`, and a plain \`while (n !== 0)\` loop would produce nothing at all.
- \`let b = n & 0x7f;\` keeps the lowest seven bits of \`n\` (0x7f is seven 1 bits, 127), which is the next base-128 digit.
- \`n >>>= 7;\` shifts those seven bits away, which is dividing by 128 and dropping the remainder. The triple \`>>>\` treats \`n\` as unsigned, so numbers up to 2³² − 1 work; with \`>>\` a number at or above 2³¹ would turn negative and the loop would never end.
- \`if (n !== 0) b |= 0x80;\` sets the top bit when something is left, meaning "another byte follows".
- \`out.push(b);\` writes the byte.
- \`} while (n !== 0);\` stops once every bit has been written.
- \`return out;\` hands back the bytes.

For 624485 the loop runs three times: the low seven bits are 0x65, so the first byte is 0xe5; then 0x0e, so 0x8e; and then 0x26 is all that is left, written without the flag.

**Common wrong attempts.**

- Setting \`0x80\` on every byte, including the last, makes a number that never ends: the engine keeps reading the following bytes as part of the size, and the module is rejected.
- Writing the high digit first (\`[0x02, 0xac]\`) is the order you would write a number on paper, but LEB128 is little-endian: lowest group first.
- \`while (n > 0) { ... }\` returns \`[]\` for 0, and a section of size 0 must still say \`00\`.`,
    wrong: [
      {
        code: `function uleb(n) {
  const out = [];
  do {
    out.push((n & 0x7f) | 0x80);
    n >>>= 7;
  } while (n !== 0);
  return out;
}`,
        why: 'Every byte, including the last, has the "more follows" bit, so `uleb(5)` is `[0x85]`, which promises a byte that never comes.',
      },
      {
        code: `function uleb(n) {
  const out = [];
  while (n > 0) {
    let b = n & 0x7f;
    n >>>= 7;
    if (n) b |= 0x80;
    out.push(b);
  }
  return out;
}`,
        why: 'Right for every number except 0, which gives `[]` instead of `[0]`: the loop body never runs.',
      },
    ],
  },
  'module-add': {
    optional: true,
    title: 'A module for add(a, b)',
    prompt: 'Change the bytes so that the module exports a function `add` that takes two f64 parameters and returns their sum: `fn add(a, b) { return a + b; }`. You need a type with two parameters, the export name "add" (0x61 0x64 0x64), a body that gets local 0 and local 1 and uses `f64.add` (0xa0), and every size updated to match.',
    starter: `function addModule() {
  return new Uint8Array([
    0x00, 0x61, 0x73, 0x6d,
    0x01, 0x00, 0x00, 0x00,
    // type: (f64) -> f64
    0x01, 0x06, 0x01,
    0x60, 0x01, 0x7c, 0x01, 0x7c,
    0x03, 0x02, 0x01, 0x00,
    // export "sq"
    0x07, 0x06, 0x01,
    0x02, 0x73, 0x71, 0x00, 0x00,
    0x0a, 0x09, 0x01, 0x07, 0x00,
    0x20, 0x00, 0x20, 0x00,
    0xa2, 0x0b,
  ]);
}`,
    solution: `function addModule() {
  return new Uint8Array([
    0x00, 0x61, 0x73, 0x6d,
    0x01, 0x00, 0x00, 0x00,
    // type: (f64, f64) -> f64
    0x01, 0x07, 0x01,
    0x60, 0x02, 0x7c, 0x7c, 0x01, 0x7c,
    0x03, 0x02, 0x01, 0x00,
    // export "add"
    0x07, 0x07, 0x01,
    0x03, 0x61, 0x64, 0x64, 0x00, 0x00,
    0x0a, 0x09, 0x01, 0x07, 0x00,
    0x20, 0x00, 0x20, 0x01,
    0xa0, 0x0b,
  ]);
}`,
    tests: `const load = () => new WebAssembly
  .Instance(new WebAssembly
    .Module(addModule())).exports;
test('the module is valid', () => {
  expect(WebAssembly.validate(addModule()))
    .toBe(true);
});
test('it exports add', () => {
  expect(typeof load().add)
    .toBe('function');
});
test('add(2, 3) is 5', () => {
  expect(load().add(2, 3)).toBe(5);
});
test('add(0.5, 0.25) is 0.75', () => {
  expect(load().add(0.5, 0.25)).toBe(0.75);
});`,
    hints: [
      'Three sections change: the type (one more parameter), the export (a longer name) and the body (a different second get, and a different operator).',
      'The type contents become `01 60 02 7c 7c 01 7c`, seven bytes, so its size byte becomes 07. The export contents become `01 03 61 64 64 00 00`, also seven bytes.',
      'The body is `00 20 00 20 01 a0 0b`: no locals, get 0, get 1, f64.add, end. That is still 7 bytes, so the code section sizes (09 and 07) stay the same.',
    ],
    walkthrough: `**How to think about it.** Start from the module for \`sq\` and ask what is different about \`add\`: it has two parameters instead of one, it is called "add", and its body adds two different locals instead of multiplying one by itself. Each difference lives in one section, and every time a section's contents change length, its size byte must change too. Count bytes carefully; a size that is off by one is the commonest mistake, and the engine refuses the whole module.

**The solution, line by line.**

- \`0x00, 0x61, 0x73, 0x6d, 0x01, 0x00, 0x00, 0x00\` is the unchanged preamble: "\\0asm" and version 1.
- \`0x01, 0x07, 0x01\` is the type section's id (1), its new size (7) and the number of types (1).
- \`0x60, 0x02, 0x7c, 0x7c, 0x01, 0x7c\` is the function type: \`60\`, then two parameters, both f64, then one result, f64. With the count byte that is 7 bytes of contents.
- \`0x03, 0x02, 0x01, 0x00\` is the unchanged function section: one function, with type 0.
- \`0x07, 0x07, 0x01\` is the export section's id, its new size and one export.
- \`0x03, 0x61, 0x64, 0x64, 0x00, 0x00\` is the name's length (3), the letters a, d, d, the kind (0, a function) and the function's index (0).
- \`0x0a, 0x09, 0x01, 0x07, 0x00\` is the code section: id 10, size 9, one body, the body's size 7, and no extra locals.
- \`0x20, 0x00, 0x20, 0x01\` gets local 0 (\`a\`) and then local 1 (\`b\`); parameters are the first locals, in order.
- \`0xa0, 0x0b\` is f64.add and end. The add pops both values and pushes their sum, which is what the function returns.

**Common wrong attempts.**

- Changing the name to "add" but leaving the export section's size at 6: the name is one byte longer, so the section is 7 bytes, and the engine reports a malformed module.
- Keeping \`0x20, 0x00\` twice in the body computes \`a + a\`, so \`add(2, 3)\` is 4.
- Adding the second parameter but forgetting the type's size byte (still 06) shifts every later byte by one.`,
    wrong: [
      {
        code: `function addModule() {
  return new Uint8Array([
    0x00, 0x61, 0x73, 0x6d,
    0x01, 0x00, 0x00, 0x00,
    0x01, 0x07, 0x01,
    0x60, 0x02, 0x7c, 0x7c, 0x01, 0x7c,
    0x03, 0x02, 0x01, 0x00,
    0x07, 0x07, 0x01,
    0x03, 0x61, 0x64, 0x64, 0x00, 0x00,
    0x0a, 0x09, 0x01, 0x07, 0x00,
    0x20, 0x00, 0x20, 0x00,
    0xa0, 0x0b,
  ]);
}`,
        why: 'The body gets local 0 twice, so it computes `a + a`: `add(2, 3)` returns 4.',
      },
      {
        code: `function addModule() {
  return new Uint8Array([
    0x00, 0x61, 0x73, 0x6d,
    0x01, 0x00, 0x00, 0x00,
    0x01, 0x07, 0x01,
    0x60, 0x02, 0x7c, 0x7c, 0x01, 0x7c,
    0x03, 0x02, 0x01, 0x00,
    0x07, 0x06, 0x01,
    0x03, 0x61, 0x64, 0x64, 0x00, 0x00,
    0x0a, 0x09, 0x01, 0x07, 0x00,
    0x20, 0x00, 0x20, 0x01,
    0xa0, 0x0b,
  ]);
}`,
        why: 'The export section still says its size is 6, but "add" made it 7 bytes long, so the engine rejects the module as malformed.',
      },
    ],
  },
};

export const quiz = [
  {
    q: 'Which of these is **not** runtime code generation?',
    options: [
      {
        t: 'A program calls `new Function("x", "return x + 1")` and then calls the result.',
        why: 'It is: source text is compiled into a new function during the run.',
      },
      {
        t: 'A program builds WebAssembly bytes and instantiates them.',
        why: 'It is: the engine compiles the new module to machine code during the run.',
      },
      {
        t: 'A C compiler writes an executable file that a user runs the next day.',
        correct: true,
        why: 'Right: the code was made before the program ran, by a different program. Runtime code generation happens inside the running program.',
      },
      {
        t: 'A JIT writes machine code into a page and calls it.',
        why: 'It is: that is the native form of runtime code generation.',
      },
    ],
  },
  {
    q: 'A native JIT has written its code into a read+write page. What must it do before calling it?',
    options: [
      {
        t: 'Nothing: the bytes are in memory, so the processor can run them.',
        why: 'The page has no execute permission, so jumping into it makes the kernel stop the program; and the instruction cache may not have seen the stores.',
      },
      {
        t: 'Make the page read+execute with mprotect, and flush the instruction cache.',
        correct: true,
        why: 'Right: execute on (and write off, to keep W^X), then make instruction fetches see the new bytes (fence.i on RISC-V).',
      },
      {
        t: 'Make the page read+write+execute, so that it can keep patching the code.',
        why: 'That works on many systems but breaks W^X: any bug that lets an attacker write there now lets them run code. Some platforms forbid it outright.',
      },
    ],
  },
  {
    q: 'Why is a JIT that is written in JavaScript built on WebAssembly?',
    options: [
      {
        t: 'WebAssembly runs without being compiled.',
        why: 'The engine compiles WebAssembly to machine code; that is exactly the work the JIT wants done.',
      },
      {
        t: 'JavaScript cannot obtain executable memory, but it can hand WebAssembly bytes to the engine to check and compile.',
        correct: true,
        why: 'Right: the engine does the mapping, protecting and flushing itself, after checking the module.',
      },
      {
        t: 'WebAssembly modules can call mmap.',
        why: 'They cannot; a module only sees the memory and functions it is given.',
      },
    ],
  },
  {
    q: 'A WebAssembly code section reads `0a 09 01 07 00 20 00 20 00 a2 0b`. What does the `09` say?',
    options: [
      {
        t: 'There are nine instructions.',
        why: 'There are four instructions plus the locals byte; 09 is a size in bytes.',
      },
      {
        t: 'The function has nine locals.',
        why: 'The locals are declared by the `00` after the body size: none.',
      },
      {
        t: 'The contents of the code section are nine bytes long.',
        correct: true,
        why: 'Right: every section is its id (0a = 10), its size (9) and its contents: the count, the body size and the 7-byte body.',
      },
    ],
  },
  {
    q: 'What is `uleb(128)`?',
    options: [
      {
        t: '`[0x80, 0x01]`',
        correct: true,
        why: 'Right: the low seven bits are 0, with the "more follows" bit set (0x80), then 128 >> 7 = 1.',
      },
      {
        t: '`[0x80]`',
        why: 'A lone 0x80 says "another byte follows" and then nothing does.',
      },
      {
        t: '`[0x01, 0x00]`',
        why: 'That is the high group first; LEB128 puts the lowest seven bits first.',
      },
      {
        t: '`[0xff, 0x01]`',
        why: '0xff would be the digit 127 with the flag; 127 + 128 × 1 is 255, not 128.',
      },
    ],
  },
  {
    q: 'JavaScript calls a WebAssembly export whose parameter is f64 with the argument `"7"`. What happens?',
    options: [
      {
        t: 'A TypeError, because a string is not a number.',
        why: 'The JS API converts f64 arguments with ToNumber, which does not throw for "7".',
      },
      {
        t: 'The function receives NaN.',
        why: 'ToNumber("7") is 7; only a string that is not a number gives NaN.',
      },
      {
        t: 'The function receives 7.',
        correct: true,
        why: 'Right: the argument goes through ToNumber. A JIT for a language with different rules (Drip refuses "7" < 3) must check its arguments itself.',
      },
    ],
  },
];
