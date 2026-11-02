export default {
  id: 'IV', track: 'A', days: '34–41', title: 'Drip, compiled: a virtual machine of our own',
  blurb: 'Compile Drip to bytecode and run it on a stack VM: hash tables, string interning, call frames, upvalues and a garbage collector.',
  chapters: [
    { n: 136, title: 'Why bytecode?', introduces: {
      bytecode: 'a compact list of simple instructions',
      opcode: 'the number identifying an instruction',
    } },
    { n: 137, title: 'A machine made of software', introduces: {
      'virtual-machine': 'a program that executes bytecode',
    } },
    { n: 138, title: 'Bytecode as data', introduces: {
      chunk: 'a sequence of bytecode plus its constants',
      'constant-pool': 'a table of literal values a chunk uses',
    } },
    { n: 139, title: 'Reading bytecode back: a disassembler', introduces: {
      disassembler: 'prints bytecode as readable text',
    } },
    { n: 140, title: 'A machine with a stack', introduces: {
      'stack-machine': 'a VM whose instructions push and pop a value stack',
      'instruction-pointer': 'which instruction runs next',
    } },
    { n: 141, title: 'The dispatch loop', introduces: {
      'dispatch-loop': 'the loop that decodes and runs instructions',
    } },
    { n: 142, title: 'One pass from source to bytecode', introduces: { 'single-pass-compiler': 'parsing and emitting code at the same time', emit: 'appending an instruction to the chunk' } },
    { n: 143, title: 'Tagging values at run time', introduces: { 'tagged-value': 'a value plus a tag saying its type', 'value-representation': 'the memory layout of runtime values' } },
    { n: 144, title: 'Objects that live on the heap', introduces: { 'heap-object': 'a value that lives on the heap behind a pointer', 'object-list': 'the VM tracking every allocation' } },
    { n: 145, title: 'Lists in the VM', introduces: {
      'vm-list': 'a growable list object on the VM heap, with instructions to build, read and write it',
    } },
    { n: 146, title: 'Finding things fast: hash tables', introduces: {
      'hash-function': 'turning a key into a number',
      'hash-table': 'an array indexed by hashes',
    } },
    { n: 147, title: 'Collisions, tombstones and growing', introduces: {
      'open-addressing': 'probing for the next free slot',
      'load-factor': 'how full a table is allowed to get',
    } },
    { n: 148, title: 'String interning', introduces: { interning: 'keeping one copy of each distinct string' } },
    { n: 149, title: 'Globals by name', introduces: { 'global-table': 'globals stored in a hash table by name' } },
    { n: 150, title: 'Locals as stack slots', introduces: {
      'stack-slot': 'a local variable living at a fixed stack position',
    } },
    { n: 151, title: 'Compile-time scope: turning names into slots', introduces: {
      'compile-time-scope': 'the compiler tracking locals while compiling',
    } },
    { n: 152, title: 'Branches and loops in bytecode', introduces: {
      jump: 'an instruction that moves the instruction pointer',
    } },
    { n: 153, title: 'Backpatching: if, for, break and continue', introduces: {
      backpatching: 'filling in a jump target once it is known',
    } },
    { n: 154, title: 'Frames: calling and returning in the VM', introduces: {
      'call-frame': 'one function invocation’s window onto the stack',
    } },
    { n: 155, title: 'The frame pointer: one stack, many windows', introduces: {
      'frame-pointer': 'where a frame’s slots begin',
    } },
    { n: 156, title: 'Capturing variables: upvalues', introduces: {
      upvalue: 'a captured variable reachable from a closure',
      'open-upvalue': 'an upvalue still pointing at a live stack slot',
    } },
    { n: 157, title: 'Closing upvalues: a fresh variable every pass', introduces: {
      'closed-upvalue': 'an upvalue that moved to the heap',
    } },
    { n: 158, title: 'Reclaiming memory: mark and sweep', introduces: {
      'garbage-collection': 'reclaiming memory nothing can reach',
      roots: 'where reachability starts',
    } },
    { n: 159, title: 'Tracing and sweeping: white, grey and black', introduces: {
      tricolor: 'white, grey and black objects during marking',
      'mark-sweep': 'mark reachable objects, free the rest',
    } },
    { n: 160, title: 'Objects and method calls in the VM', introduces: {
      initializer: 'the method run when an instance is created',
    } },
    { n: 161, title: 'Invoking methods, and inheritance in the VM', introduces: {
      'method-invocation': 'calling a method without making a bound-method object',
    } },
    { n: 162, title: 'Measuring and speeding up the VM', introduces: {
      superinstruction: 'one instruction doing the work of several',
    } },
    { n: 163, title: 'NaN-boxing and generational collection', introduces: {
      'nan-boxing': 'packing every value into one 64-bit double',
      'generational-gc': 'collecting young objects more often',
    } },
  ],
};
