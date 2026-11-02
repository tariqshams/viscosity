export default {
  id: 'XIII', section: 'deep', days: '15–22', title: 'Deep dive: a native back end on RISC-V',
  blurb: 'Machine code and RISC-V, calling conventions, instruction selection, leaving SSA, register allocation, scheduling, peephole optimisation, linking, a tiny JIT, Drip to RISC-V end to end, and how LLVM, clang and rustc are built.',
  chapters: [
    { n: 225, title: 'Machine code and assembly', introduces: {
      'machine-code': 'the bytes a CPU actually runs',
      'assembly-language': 'machine code written as text',
    } },
    { n: 226, title: 'Instruction sets and RISC-V', introduces: {
      isa: 'instruction set architecture: the contract between hardware and software',
      'risc-v': 'a small, open instruction set',
    } },
    { n: 227, title: 'RISC-V: registers, memory and the stack', introduces: {
      'load-store': 'only loads and stores touch memory',
      'addressing-mode': 'how an instruction names a memory location',
      'stack-pointer': 'the register that marks the top of the stack',
    } },
    { n: 228, title: 'Calling conventions and the ABI', introduces: {
      'calling-convention': 'where arguments, results and the return address go',
      abi: 'application binary interface: the rules compiled code agrees on',
    } },
    { n: 229, title: 'Saving registers: prologues and epilogues', introduces: {
      'caller-callee-saved': 'which registers each side must preserve',
      'prologue-epilogue': 'the code that builds and tears down a frame',
    } },
    { n: 230, title: 'Code shape: lowering control flow and data', introduces: {
      'code-shape': 'the patterns a compiler uses to express each construct',
      'array-address-arithmetic': 'base + index × size',
    } },
    { n: 231, title: 'Jump tables', introduces: {
      'jump-table': 'switch compiled to an indexed jump',
    } },
    { n: 232, title: 'Instruction selection by tree tiling', introduces: {
      'instruction-selection': 'choosing machine instructions for IR operations',
      'tree-tiling': 'covering an IR tree with instruction patterns',
    } },
    { n: 233, title: 'Optimal tiling by dynamic programming', introduces: {
      'optimal-tiling': 'the cheapest cover, found by dynamic programming',
    } },
    { n: 234, title: 'Leaving SSA', introduces: {
      'ssa-destruction': 'replacing phi nodes with copies',
      'lost-copy-problem': 'the bug naive phi removal causes',
    } },
    { n: 235, title: 'Parallel copies and the swap problem', introduces: {
      'parallel-copy': 'several copies that happen at once',
    } },
    { n: 236, title: 'Live ranges and interference', introduces: {
      'live-range': 'where a value is alive',
      'interference-graph': 'values that are alive at the same time, as a graph',
    } },
    { n: 237, title: 'Register allocation by graph colouring', introduces: {
      'register-allocation': 'deciding which values live in which registers',
      'graph-coloring': 'giving neighbours different colours',
      'simplify-select': 'Chaitin and Briggs’s colouring algorithm',
    } },
    { n: 238, title: 'Coalescing', introduces: {
      coalescing: 'merging copies so they disappear',
    } },
    { n: 239, title: 'Spilling and linear scan', introduces: {
      spilling: 'keeping a value in memory when registers run out',
    } },
    { n: 240, title: 'Linear scan', introduces: {
      'linear-scan': 'allocating registers in one pass over live intervals',
      'live-interval': 'a live range flattened to a start and an end',
    } },
    { n: 241, title: 'Instruction scheduling', introduces: {
      'instruction-scheduling': 'reordering instructions to keep the CPU busy',
      'dependence-dag': 'which instructions must wait for which',
    } },
    { n: 242, title: 'List scheduling', introduces: {
      'list-scheduling': 'the greedy scheduling algorithm',
    } },
    { n: 243, title: 'Software pipelining', introduces: {
      'software-pipelining': 'overlapping iterations of a loop',
    } },
    { n: 244, title: 'Iterative modulo scheduling', introduces: {
      'modulo-scheduling': 'one schedule repeated every few cycles',
    } },
    { n: 245, title: 'Peephole optimisation', introduces: {
      peephole: 'improving short windows of instructions',
      superoptimization: 'searching for the shortest correct sequence',
    } },
    { n: 246, title: 'Assemblers, object files and linking', introduces: {
      assembler: 'a program that turns assembly into machine code',
      'object-file': 'machine code plus symbols and relocations',
      relocation: 'a hole the linker fills with an address',
    } },
    { n: 247, title: 'Linkers and loaders', introduces: {
      linker: 'the program that joins object files',
      loader: 'the program that puts a binary in memory and runs it',
    } },
    { n: 248, title: 'A tiny JIT', introduces: {
      'runtime-code-generation': 'writing code while the program runs',
    } },
    { n: 249, title: 'Compiling hot Drip functions to WebAssembly', introduces: {
      'jit-from-scratch': 'a JIT that compiles hot Drip functions to WebAssembly',
    } },
    { n: 250, title: 'Drip to RISC-V, end to end', introduces: {
      'native-pipeline': 'source to native code through every stage',
    } },
    { n: 251, title: 'From virtual registers to a running program', introduces: {
      'isa-simulator': 'a program that runs machine instructions in software, one at a time',
    } },
    { n: 252, title: 'Real back ends: LLVM, clang and rustc', introduces: {
      'llvm-ir': 'LLVM’s typed SSA IR',
      'llvm-pass': 'a transformation over LLVM IR',
    } },
    { n: 253, title: 'Inside LLVM’s code generator, clang and rustc', introduces: {
      'compiler-architecture-tour': 'how clang and rustc are put together',
    } },
  ],
};
