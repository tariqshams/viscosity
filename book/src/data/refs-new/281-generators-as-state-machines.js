// New references for chapter 281 (Generators as state machines).
// Checked 2026-11-02 by reading the raw source files named in each
// checkedAgainst from GitHub (raw.githubusercontent.com) in the writing
// session. The output the chapter quotes was produced in the same session
// with TypeScript 5.9.3 (tsc --target es5 --lib es2015 --noEmitHelpers),
// Node 22.23.4 (--print-bytecode --print-bytecode-filter=count) and
// Python 3.13.18 (dis).
export default [
  {
    id: 'tslib-generator',
    authors: ['Microsoft Corporation'],
    title: 'tslib: runtime library for TypeScript helpers (the __generator helper)',
    venue: 'microsoft/tslib, tslib.js',
    year: null,
    doi: null,
    url: 'https://github.com/microsoft/tslib/blob/main/tslib.js',
    accessed: '2026-11-02',
    checkedAgainst: 'tslib.js read raw from github.com/microsoft/tslib (main, commit 1fd51ada1a20) on 2026-11-02. __generator(thisArg, body) keeps a state object _ with label 0, and its step function interprets the instruction arrays the compiled body returns: “case 4: _.label++; return { value: op[1], done: false };” (yield), “case 5: _.label++; y = op[1]” (yield*), op[0] === 3 sets “_.label = op[1]” (break, i.e. jump to a label), and opcode 2 is return; next, throw and return on the generator object are verb(0), verb(1) and verb(2). tsc 5.9.3 --target es5 compiled the chapter’s count into a function returning __generator(this, function (_a) { switch (_a.label) { … return [4 /*yield*/, i]; … return [3 /*break*/, 1]; … return [2 /*return*/, "done"]; } }).',
    shaped: 'Chapter 281: TypeScript’s ES5 lowering of a generator to a switch on a label, and what the returned instruction arrays mean.',
  },
  {
    id: 'v8-interpreter-generator',
    authors: ['The V8 project authors'],
    title: 'interpreter-generator.cc and bytecodes.h (V8 Ignition interpreter source)',
    venue: 'v8/v8, src/interpreter/interpreter-generator.cc',
    year: null,
    doi: null,
    url: 'https://github.com/v8/v8/blob/main/src/interpreter/interpreter-generator.cc',
    accessed: '2026-11-02',
    checkedAgainst: 'src/interpreter/interpreter-generator.cc, bytecodes.h and bytecode-generator.cc read raw from github.com/v8/v8 (main, commit fbf9d25cbb03) on 2026-11-02. SuspendGenerator: “Stores the parameters and the register file in the generator. Also stores the current context, |suspend_id|, and the current bytecode offset (for debugging purposes) into the generator. Then, returns the value in the accumulator.” SwitchOnGeneratorState: “If |generator| is undefined, falls through. Otherwise, loads the generator’s state (overwriting it with kGeneratorExecuting) … and performs state dispatch on the generator’s state by looking up the generator state in a jump table in the constant pool”. ResumeGenerator: “Imports the register file stored in the generator and marks the generator state as executing.” bytecode-generator.cc: “If the generator is not undefined, this is a resume, so perform state dispatch.” node 22.23.4 --print-bytecode printed “SwitchOnGeneratorState r0, [0], [2] { 0: @20, 1: @62 }”, SuspendGenerator and ResumeGenerator for the chapter’s function* count.',
    shaped: 'Chapter 281: how V8 suspends and resumes a generator (registers copied into the generator object, a jump table on its state).',
  },
  {
    id: 'cpython-generators',
    authors: ['The CPython developers'],
    title: 'Generators and Coroutines (CPython InternalDocs/generators.md)',
    venue: 'python/cpython, InternalDocs/generators.md',
    year: null,
    doi: null,
    url: 'https://github.com/python/cpython/blob/main/InternalDocs/generators.md',
    accessed: '2026-11-02',
    checkedAgainst: 'Read raw from github.com/python/cpython (main, commit 86be79a24830) on 2026-11-02: “Generators in CPython are implemented with the struct PyGenObject. They consist of a frame and metadata about the generator’s execution state”; YIELD_VALUE “puts a value on the stack and returns execution to the calling frame, but it also needs to perform additional work to leave the generator frame in a state that allows it to be resumed. In particular, it updates the frame’s instruction pointer”; “The frame of a generator is embedded in the generator object struct”; “The bytecode of a generator function begins with a RETURN_GENERATOR instruction, which creates a generator object, including its embedded frame.” python3.13 -m dis printed RETURN_GENERATOR, YIELD_VALUE 0 and RESUME 5 for the chapter’s count.',
    shaped: 'Chapter 281: CPython keeping a generator’s whole frame inside the generator object, and the RETURN_GENERATOR and YIELD_VALUE bytecodes.',
  },
];
