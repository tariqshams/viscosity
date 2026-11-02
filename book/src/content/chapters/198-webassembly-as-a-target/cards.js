// Chapter 198 cards. Keys are stable ids: never rename them.

export const prompts = {
  'wasm-what': {
    q: 'What is WebAssembly, in one sentence?',
    a: 'A standardized, portable, low-level binary format for code, which browsers and Node can validate, compile and run.',
  },
  'wasm-magic': {
    q: 'What are the first 8 bytes of every WebAssembly module?',
    a: 'The magic number `00 61 73 6d` (“\\0asm”) and the version, `01 00 00 00` (version 1).',
  },
  'wasm-section': {
    q: 'What three parts does every section of a module have?',
    a: 'A one-byte section id, the length of its contents in bytes, and the contents.',
  },
  'wasm-validate': {
    q: 'Why can an engine compile WebAssembly to machine code without keeping a real operand stack?',
    a: 'Validation type-checks every function, which fixes the stack height at every instruction, so the stack slots can be treated as registers.',
  },
  'wasm-instantiate': {
    q: 'Why is `WebAssembly.instantiate` asynchronous (it returns a promise)?',
    a: 'Compiling a large module takes time, and doing it asynchronously keeps the page responsive.',
  },
  'wasm-wrap': {
    q: 'What does the exported `add` return for `add(2147483647, 1)`, and why?',
    a: '`-2147483648`: `i32.add` works modulo 2³², so it wraps around instead of growing.',
  },
  'lm-what': {
    q: 'What is linear memory?',
    a: 'A module’s single contiguous, growable array of raw bytes, read and written by integer address.',
  },
  'lm-page': {
    q: 'In what unit does linear memory grow?',
    a: 'Pages of 64 KiB (65,536 bytes).',
  },
  'lm-trap': {
    q: 'What happens when WebAssembly loads from an address past the end of its memory?',
    a: 'It traps: the call stops and JavaScript sees a thrown `WebAssembly.RuntimeError`. Nothing outside the memory is touched.',
  },
  'lm-detach': {
    q: 'You made `new Float64Array(mem.buffer)` and then called `mem.grow(1)`. What is the view’s length now, and why?',
    a: '0. Growing detaches the old ArrayBuffer and creates a new one, so views must be made again.',
  },
  'lm-layout': {
    q: 'With capacity `cap`, at which byte does element `i` of column number `k` (8-byte numbers) start?',
    a: '`k * cap * 8 + i * 8`.',
  },
  'visc-wasm-status': {
    q: 'Does Viscosity emit WebAssembly today?',
    a: 'No. Both engines emit JavaScript. The Rust port’s `wasm` crate compiles the compiler itself to WebAssembly, so it can run in a browser.',
  },
};

export const examples = {
  'wasm-add': {
    title: 'A module written by hand',
    code: `const bytes = new Uint8Array([
  0x00, 0x61, 0x73, 0x6d, // magic
  0x01, 0x00, 0x00, 0x00, // version
  // type: (i32, i32) -> i32
  0x01, 0x07, 0x01, 0x60,
  0x02, 0x7f, 0x7f, 0x01, 0x7f,
  // function: f0 has type 0
  0x03, 0x02, 0x01, 0x00,
  // export: "add" is f0
  0x07, 0x07, 0x01, 0x03,
  0x61, 0x64, 0x64, 0x00, 0x00,
  // code: the body of f0
  0x0a, 0x09, 0x01, 0x07, 0x00,
  0x20, 0x00, // local.get 0
  0x20, 0x01, // local.get 1
  0x6a,       // i32.add
  0x0b,       // end
]);
const mod =
  new WebAssembly.Module(bytes);
const inst =
  new WebAssembly.Instance(mod);
const add = inst.exports.add;
console.log(bytes.length);
console.log(add(2, 3));
console.log(add(2147483647, 1));`,
  },
  'wasm-columns': {
    title: 'A column shared with WebAssembly',
    code: `const bytes = new Uint8Array([
  0x00, 0x61, 0x73, 0x6d,
  0x01, 0x00, 0x00, 0x00,
  // type: (i32) -> f64
  0x01, 0x06, 0x01,
  0x60, 0x01, 0x7f, 0x01, 0x7c,
  // function: f0 has type 0
  0x03, 0x02, 0x01, 0x00,
  // memory: 1 page to start
  0x05, 0x03, 0x01, 0x00, 0x01,
  // export: "mem" and "get"
  0x07, 0x0d, 0x02,
  0x03, 0x6d, 0x65, 0x6d, 0x02, 0x00,
  0x03, 0x67, 0x65, 0x74, 0x00, 0x00,
  // code: f64.load at i * 8
  0x0a, 0x0c, 0x01, 0x0a, 0x00,
  0x20, 0x00, // local.get 0
  0x41, 0x08, // i32.const 8
  0x6c,       // i32.mul
  0x2b, 0x03, 0x00, // f64.load
  0x0b,       // end
]);
const m = new WebAssembly.Module(bytes);
const { mem, get } =
  new WebAssembly.Instance(m).exports;
console.log(mem.buffer.byteLength);

const xs = new Float64Array(
  mem.buffer, 0, 4);
xs.set([1.5, 2.5, 3.5, 4.5]);
console.log(get(2));
xs[2] = 99;
console.log(get(2));

// 1.5 is 3ff8000000000000 in hex:
// smallest byte first
const b = new Uint8Array(mem.buffer);
console.log(...b.slice(0, 8));

try {
  get(8192); // byte 65536: too far
} catch (e) {
  console.log(e.name, e.message);
}
mem.grow(1);
console.log(xs.length);`,
  },
};

export const exercises = {
  planMemory: {
    title: 'Plan the columns in linear memory',
    prompt:
      'Write `planMemory(fs, cap)`. `fs` is a list of field names. Each field becomes a column of `cap` 8-byte numbers, placed one after another in linear memory, in the order given. Return `{ offsets, bytes, pages }`: `offsets` maps each field to the byte where its column starts, `bytes` is the total size of all columns, and `pages` is how many 64 KiB pages (65,536 bytes each) are needed to hold them.',
    starter: `function planMemory(fs, cap) {
  const offsets = {};
  for (let k = 0; k < fs.length; k++) {
    offsets[fs[k]] = k * cap;
  }
  const bytes = fs.length * cap;
  return { offsets, bytes, pages: 0 };
}`,
    solution: `function planMemory(fs, cap) {
  const offsets = {};
  for (let k = 0; k < fs.length; k++) {
    offsets[fs[k]] = k * cap * 8;
  }
  const bytes = fs.length * cap * 8;
  const pages =
    Math.ceil(bytes / 65536);
  return { offsets, bytes, pages };
}`,
    tests: `test('two columns of 4', () => {
  const p = planMemory(['x', 'vx'], 4);
  expect(p.offsets).toEqual({ x: 0, vx: 32 });
  expect(p.bytes).toBe(64);
});
test('a small plan needs one page', () => {
  expect(planMemory(['x', 'vx'], 4).pages).toBe(1);
});
test('three columns of 10', () => {
  const p = planMemory(['a', 'b', 'c'], 10);
  expect(p.offsets).toEqual({ a: 0, b: 80, c: 160 });
});
test('exactly one page', () => {
  const f = ['x', 'y', 'vx', 'vy'];
  expect(planMemory(f, 2048).pages).toBe(1);
});
test('one byte over needs a second page', () => {
  const f = ['x', 'y', 'vx', 'vy'];
  expect(planMemory(f, 2049).pages).toBe(2);
});`,
    hints: [
      'A column of `cap` numbers takes `cap * 8` bytes, because each f64 is 8 bytes.',
      'Column `k` starts after the `k` columns before it: at `k * cap * 8`.',
      'Pages must hold *all* the bytes, so round up: `Math.ceil(bytes / 65536)`.',
    ],
    walkthrough: `This is the layout a WebAssembly back end for SoA would need, worked out in JavaScript.

- **Offsets are in bytes.** Linear memory is addressed by byte, and every number in a column takes 8 of them. So column \`k\` starts at \`k * cap * 8\`, and element \`i\` of it would sit \`i * 8\` bytes further on.
- **Total size.** \`fs.length\` columns of \`cap * 8\` bytes each.
- **Round up.** Memory comes in whole 65,536-byte pages, and a plan that needs one byte more than a page needs two. \`Math.ceil\` does that; \`Math.floor\` or \`Math.round\` would leave the last bytes outside the memory, and the first access to them would trap.

The 4-field, 2048-element case is exactly 4 × 2048 × 8 = 65,536 bytes: one page, no more.`,
    wrong: [
      {
        code: `function planMemory(fs, cap) {
  const offsets = {};
  for (let k = 0; k < fs.length; k++) {
    offsets[fs[k]] = k * 8;
  }
  const bytes = fs.length * cap * 8;
  const pages =
    Math.ceil(bytes / 65536);
  return { offsets, bytes, pages };
}`,
        why: 'Offsets of `k * 8` put the fields of one element next to each other: that is packed AoS, not columns. Each column needs room for `cap` numbers, so the step is `cap * 8`.',
      },
      {
        code: `function planMemory(fs, cap) {
  const offsets = {};
  for (let k = 0; k < fs.length; k++) {
    offsets[fs[k]] = k * cap * 8;
  }
  const bytes = fs.length * cap * 8;
  const pages =
    Math.floor(bytes / 65536);
  return { offsets, bytes, pages };
}`,
        why: 'Rounding down gives 0 pages for a small plan and 1 page for 65,544 bytes. Memory must cover every byte, so round up.',
      },
    ],
  },
  uleb: {
    optional: true,
    title: 'Encode a length in LEB128',
    prompt:
      'Section lengths and other integers in a module are written in unsigned LEB128. Write `uleb(n)`, which returns the bytes for a non-negative integer `n` as an array: take the lowest 7 bits; shift `n` right by 7; if anything is left, set the top bit (`0x80`) of this byte and continue; otherwise this is the last byte. So `uleb(127)` is `[127]` and `uleb(128)` is `[0x80, 0x01]`.',
    starter: `function uleb(n) {
  return [n];
}`,
    solution: `function uleb(n) {
  const out = [];
  while (true) {
    const low = n & 0x7f;
    n = n >>> 7;
    if (n === 0) {
      out.push(low);
      return out;
    }
    out.push(low | 0x80);
  }
}`,
    tests: `test('small numbers take one byte', () => {
  expect(uleb(5)).toEqual([5]);
  expect(uleb(127)).toEqual([127]);
});
test('zero is one byte', () => {
  expect(uleb(0)).toEqual([0]);
});
test('128 takes two bytes', () => {
  expect(uleb(128)).toEqual([0x80, 0x01]);
});
test('a three-byte number', () => {
  const b = uleb(624485);
  expect(b).toEqual([0xe5, 0x8e, 0x26]);
});
test('one page in bytes', () => {
  const b = uleb(65536);
  expect(b).toEqual([0x80, 0x80, 0x04]);
});`,
    hints: [
      '`n & 0x7f` gives the lowest 7 bits; `n >>> 7` drops them.',
      'Every byte except the last has its top bit set: `low | 0x80`.',
      'Zero still needs one byte, so check whether anything is left *after* taking the first 7 bits.',
    ],
    walkthrough: `LEB128 writes a number 7 bits at a time, smallest group first. The eighth bit of each byte says “more bytes follow”.

- **Take 7 bits:** \`n & 0x7f\` (chapter 32’s bit operations).
- **Drop them:** \`n >>> 7\`. The unsigned shift keeps large numbers positive.
- **More to come?** If \`n\` is not 0 yet, push \`low | 0x80\` and go round again. Otherwise push \`low\` as the last byte and stop.

624485 is \`0b100110_0001110_1100101\`: the groups 1100101, 0001110 and 100110 become 0xE5, 0x8E and 0x26. Small numbers, like every length in this chapter’s modules, fit in one byte, which is why the format stays compact.`,
    wrong: [
      {
        code: `function uleb(n) {
  const out = [];
  while (n > 0) {
    out.push(n & 0x7f);
    n = n >>> 7;
  }
  return out;
}`,
        why: 'Two bugs. No byte gets the 0x80 “more follows” bit, so a decoder can’t tell where the number ends; and `uleb(0)` returns an empty array instead of `[0]`.',
      },
    ],
  },
};

export const quiz = [
  {
    q: 'What do the first four bytes `00 61 73 6d` of a module do?',
    options: [
      { t: 'They give the number of sections', why: 'Sections are just read one after another; there is no count up front.' },
      { t: 'They are the magic number “\\0asm”, marking the file as WebAssembly', correct: true, why: 'A zero byte and the ASCII codes for a, s, m. The version follows.' },
      { t: 'They are the version number', why: 'The version is the next four bytes, `01 00 00 00`.' },
      { t: 'They are the first instruction', why: 'Instructions only appear inside the code section.' },
    ],
  },
  {
    q: 'A function body is `20 00 20 01 6a 0b`. What kind of machine runs it?',
    options: [
      { t: 'A register machine with named registers', why: 'There are no register operands; `local.get` pushes and `i32.add` pops.' },
      { t: 'A tree-walking interpreter', why: 'There is no tree here, only a flat list of opcodes.' },
      { t: 'A stack machine, like your Drip VM', correct: true, why: 'Push, push, add, end: the same model as Part IV, though engines usually compile it to machine code.' },
      { t: 'The JavaScript engine’s parser', why: 'WebAssembly is not JavaScript source and isn’t parsed as such.' },
    ],
  },
  {
    q: 'Why does the book’s runnable example use `new WebAssembly.Module` instead of `WebAssembly.instantiate`?',
    options: [
      { t: 'instantiate doesn’t work in Node', why: 'It works in Node; the chapter’s modules were checked with it.' },
      { t: 'The synchronous constructors make faster code', why: 'Both compile the same module; only the timing of the work differs.' },
      { t: 'instantiate can’t take raw bytes', why: 'It takes bytes (a buffer) or an already compiled module.' },
      { t: 'The runner stops when your code returns, before a promise could finish', correct: true, why: 'Synchronous loading prints its output before the runner stops. In real pages, prefer the asynchronous form.' },
    ],
  },
  {
    q: 'A module’s memory is 1 page. What happens on `f64.load` at byte 65,536?',
    options: [
      { t: 'It traps, and JavaScript sees a RuntimeError', correct: true, why: 'The last valid 8-byte load in one page starts at 65,528. Out-of-bounds accesses trap.' },
      { t: 'It returns undefined', why: 'WebAssembly has no undefined; a load either returns a number or traps.' },
      { t: 'It reads whatever is in the next page of the computer’s memory', why: 'That would be unsafe. Every access is checked against the memory’s size.' },
      { t: 'The memory grows automatically', why: 'Growing only happens when code calls `memory.grow` (or `mem.grow` from JavaScript).' },
    ],
  },
  {
    q: 'After `mem.grow(1)`, an old `Float64Array` over `mem.buffer` has length 0. What should a SoA back end do?',
    options: [
      { t: 'Nothing: the view will update by itself', why: 'A detached buffer stays detached. The old view is useless.' },
      { t: 'Never grow the memory', why: 'Then collections couldn’t grow; amortized growth needs bigger storage.' },
      { t: 'Create new views over the new `mem.buffer` after every grow', correct: true, why: 'Growing detaches the old buffer and creates a new one, so views must be made again.' },
      { t: 'Copy the old view into a new ArrayBuffer', why: 'The old view has no data left to copy, and the data is still in the memory anyway.' },
    ],
  },
  {
    q: 'Which statement about Viscosity and WebAssembly is true at the time of writing?',
    options: [
      { t: 'Viscosity compiles hot loops to WebAssembly', why: 'No engine in the repository emits WebAssembly.' },
      { t: 'The TypeScript engine has a WebAssembly plugin', why: 'Its plugins are the JavaScript and Python front-ends, which rewrite source.' },
      { t: 'The book’s playground runs the Rust engine as WebAssembly', why: 'The playground uses the TypeScript engine, bundled as JavaScript by `packages/playground/build.mjs`.' },
      { t: 'The Rust port can be compiled to WebAssembly, but it still emits JavaScript', correct: true, why: 'Its `wasm` crate wraps `compile(source)` for the browser. That runs the compiler as WebAssembly; the output is JavaScript.' },
    ],
  },
];
