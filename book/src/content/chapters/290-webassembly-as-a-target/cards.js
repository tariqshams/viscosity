// Chapter 290 cards. Keys are stable ids: never rename them.

export const prompts = {
  'wasm-what': {
    q: 'What is WebAssembly, in one sentence?',
    a: 'A standardised, portable, low-level binary format for code, which browsers and Node can validate, compile and run.',
  },
  'wasm-magic': {
    q: 'What are the first 8 bytes of every WebAssembly module?',
    a: 'The magic number `00 61 73 6d` (“\\0asm”) and the version, `01 00 00 00` (version 1).',
  },

  'wasm-validate': {
    q: 'Why can an engine compile WebAssembly to machine code without keeping a real operand stack?',
    a: 'Validation type-checks every function, which fixes the stack height at every instruction, so the stack slots can be treated as registers.',
  },

  'wasm-wrap': {
    q: 'What does the exported `add` return for `add(2147483647, 1)`, and why?',
    a: '`-2147483648`: `i32.add` works modulo 2³², so it wraps around instead of growing.',
  },
  'lm-what': {
    q: 'What is linear memory?',
    a: 'A module’s single contiguous, growable array of raw bytes, read and written by integer address.',
  },

  'lm-trap': {
    q: 'What happens when WebAssembly loads from an address past the end of its memory?',
    a: 'It traps: the call stops and JavaScript sees a thrown `WebAssembly.RuntimeError`. Nothing outside the memory is touched.',
  },
  'lm-detach': {
    q: 'You made `new Float64Array(mem.buffer)` and then called `mem.grow(1)`. What is the view’s length now, and why?',
    a: '0. Growing detaches the old ArrayBuffer and creates a new one, so views must be made again.',
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
    walkthrough: `**How to think about it.** This is the layout a WebAssembly back end for SoA would need, worked out in JavaScript. Draw it first for the first test: two fields, capacity 4, 8 bytes per number. The \`x\` column needs 4 × 8 = 32 bytes, so it fills bytes 0 to 31, and the \`vx\` column starts right after it, at byte 32; together they take 64 bytes, which fits easily in one page. The general rule falls out of the picture: every column is \`cap * 8\` bytes long, column number \`k\` starts after the \`k\` columns before it, and the page count must be enough to hold *every* byte, so it is a division rounded up.

**The solution, line by line.**

- \`function planMemory(fs, cap) {\` takes the field names, in order, and the capacity.
- \`  const offsets = {};\` will map each field to the byte where its column starts.
- \`  for (let k = 0; k < fs.length; k++) {\` walks the fields by position, because the position decides the start.
- \`    offsets[fs[k]] = k * cap * 8;\` is the start of column \`k\`: \`k\` whole columns of \`cap\` numbers of 8 bytes come before it.
- \`  const bytes = fs.length * cap * 8;\` is the total: every column, end to end.
- \`  const pages =\` and \`    Math.ceil(bytes / 65536);\` round up to whole 64 KiB pages, because memory only comes in pages and the last byte must be inside it.
- \`  return { offsets, bytes, pages };\` returns the three answers in one object.

The four-field, 2048-element test is exactly 4 × 2048 × 8 = 65,536 bytes, so one page; with 2049 elements it is 65,600 bytes, so two.

**Common wrong attempts.**

- Offsets of \`k * 8\`: that puts the fields of one element next to each other, which is packed AoS, not columns. Each column needs room for \`cap\` numbers, so the step between columns is \`cap * 8\`.
- \`Math.floor\` (or \`Math.round\`) for the pages: a small plan gets 0 pages, and 65,544 bytes gets 1, so the last bytes would lie outside the memory and the first access to them would trap.`,
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
    walkthrough: `**How to think about it.** LEB128 writes a number 7 bits at a time, smallest group first, and uses the eighth bit of each byte to say "more bytes follow". So the loop is: cut off the lowest 7 bits, shift them away, and decide whether this byte is the last one by looking at what is *left*. Try \`128\` by hand: its lowest 7 bits are 0 and what is left is 1, so the first byte is \`0 | 0x80 = 0x80\`; then the lowest 7 bits of 1 are 1 and nothing is left, so the last byte is \`0x01\`. Notice that zero must still produce one byte, so the "is anything left?" test has to come *after* taking the first group, not before.

**The solution, line by line.**

- \`function uleb(n) {\` takes a non-negative integer.
- \`  const out = [];\` collects the bytes.
- \`  while (true) {\` loops until the last byte is written; the \`return\` inside ends it.
- \`    const low = n & 0x7f;\` keeps the lowest 7 bits (\`0x7f\` is seven 1-bits), using the bit operations from *Bits and bytes*.
- \`    n = n >>> 7;\` drops those 7 bits; the unsigned shift \`>>>\` keeps large numbers from turning negative.
- \`    if (n === 0) {\` asks whether anything is left;
- \`      out.push(low);\` and \`      return out;\` write the final byte, top bit clear, and stop.
- \`    out.push(low | 0x80);\` otherwise writes this group with the top bit set, meaning "more follows", and the loop goes round again.

For 624485 the 7-bit groups, smallest first, are 1100101, 0001110 and 100110, which become 0xE5, 0x8E (both with the top bit set) and 0x26.

**Common wrong attempts.**

- Looping \`while (n > 0)\` and never setting \`0x80\`: a decoder cannot tell where the number ends, and \`uleb(0)\` returns an empty array instead of \`[0]\`.
- Setting \`0x80\` on every byte, including the last: the decoder keeps reading past the number into whatever comes next.`,
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
      { t: 'Never grow the memory', why: 'Then collections couldn’t grow; amortised growth needs bigger storage.' },
      { t: 'Create new views over the new `mem.buffer` after every grow', correct: true, why: 'Growing detaches the old buffer and creates a new one, so views must be made again.' },
      { t: 'Copy the old view into a new ArrayBuffer', why: 'The old view has no data left to copy, and the data is still in the memory anyway.' },
    ],
  },
  {
    q: 'Which statement about Viscosity and WebAssembly is true at the time of writing?',
    options: [
      { t: 'Viscosity compiles hot loops to WebAssembly', why: 'No engine in the repository emits WebAssembly.' },
      { t: 'The TypeScript engine has a WebAssembly plugin', why: 'Its plugins are the JavaScript and Python front-ends, which rewrite source.' },
      { t: 'The book’s playground compiles your program to WebAssembly before running it', why: 'Switched to Rust, the playground runs the *compiler* as WebAssembly, but what it produces is still JavaScript or Python.' },
      { t: 'The Rust port can be compiled to WebAssembly, but it still emits JavaScript', correct: true, why: 'Its `wasm` crate wraps `compile(source)` for the browser. That runs the compiler as WebAssembly; the output is JavaScript.' },
    ],
  },
];
