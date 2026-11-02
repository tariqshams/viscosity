export default {
  id: 'IV', section: 'core', days: '7–10', title: 'Core 3: a bytecode virtual machine',
  blurb: 'Why bytecode, chunks and a disassembler, a stack machine, a one-pass compiler, tagged values and heap objects, hash tables and interning, locals, jumps, frames, upvalues, mark and sweep, classes, and speeding it up.',
  chapters: [
    { n: 72, title: 'Why bytecode', introduces: {
      'interpreter-overhead': 'why walking trees is slow',
      bytecode: 'a compact list of simple instructions',
      opcode: 'the number identifying an instruction',
      'virtual-machine': 'a program that executes bytecode',
    } },
    { n: 73, title: 'Bytecode as data, and a disassembler', introduces: {
      chunk: 'a sequence of bytecode plus its constants',
      'constant-pool': 'a table of literal values a chunk uses',
      disassembler: 'prints bytecode as readable text',
    } },
    { n: 74, title: 'A stack machine and its dispatch loop', introduces: {
      'stack-machine': 'a VM whose instructions push and pop a value stack',
      'instruction-pointer': 'which instruction runs next',
      'dispatch-loop': 'the loop that decodes and runs instructions',
    } },
    { n: 75, title: 'One pass from source to bytecode', introduces: {
      'single-pass-compiler': 'parsing and emitting code at the same time',
      emit: 'appending an instruction to the chunk',
    } },
    { n: 76, title: 'Tagging values at run time', introduces: {
      'tagged-value': 'a value plus a tag saying its type',
      'value-representation': 'the memory layout of runtime values',
    } },
    { n: 77, title: 'Heap objects and lists in the VM', introduces: {
      'heap-object': 'a value that lives on the heap behind a pointer',
      'object-list': 'the VM tracking every allocation',
      'vm-list': 'a growable list object on the VM heap, with instructions to build, read and write it',
    } },
    { n: 78, title: 'Hash tables', introduces: {
      'hash-function': 'turning a key into a number',
      'hash-table': 'an array indexed by hashes',
      'open-addressing': 'probing for the next free slot',
      'load-factor': 'how full a table is allowed to get',
    } },
    { n: 79, title: 'String interning and globals by name', introduces: {
      interning: 'keeping one copy of each distinct string',
      'global-table': 'globals stored in a hash table by name',
    } },
    { n: 80, title: 'Locals as stack slots', introduces: {
      'stack-slot': 'a local variable living at a fixed stack position',
      'compile-time-scope': 'the compiler tracking locals while compiling',
    } },
    { n: 81, title: 'Jumps: branches, loops and backpatching', introduces: {
      jump: 'an instruction that moves the instruction pointer',
      backpatching: 'filling in a jump target once it is known',
    } },
    { n: 82, title: 'Frames: calling and returning', introduces: {
      'call-frame': 'one function invocation’s window onto the stack',
      'frame-pointer': 'where a frame’s slots begin',
    } },
    { n: 83, title: 'Upvalues: capturing and closing', introduces: {
      upvalue: 'a captured variable reachable from a closure',
      'open-upvalue': 'an upvalue still pointing at a live stack slot',
      'closed-upvalue': 'an upvalue that moved to the heap',
    } },
    { n: 84, title: 'Reclaiming memory: mark and sweep', introduces: {
      'garbage-collection': 'reclaiming memory nothing can reach',
      roots: 'where reachability starts',
      tricolor: 'white, grey and black objects during marking',
      'mark-sweep': 'mark reachable objects, free the rest',
    } },
    { n: 85, title: 'Classes and method calls in the VM', introduces: {
      initializer: 'the method run when an instance is created',
      'method-invocation': 'calling a method without making a bound-method object',
    } },
    { n: 86, title: 'Measuring and speeding up the VM', introduces: {
      superinstruction: 'one instruction doing the work of several',
      'nan-boxing': 'packing every value into one 64-bit double',
      'generational-gc': 'collecting young objects more often',
    } },
  ],
};
