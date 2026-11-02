// A native back end. Added in the 2026-11 expansion (scripts/expansion/plan.mjs).
export default {
  id: 'VII', track: 'A', days: '57–61', title: 'A native back end',
  blurb: 'Machine code, RISC-V assembly, calling conventions, instruction selection, register allocation, scheduling, linking and a tiny JIT: everything between an IR and a running binary.',
  chapters: [
    { n: 226, title: 'Machine code and assembly', introduces: {
      'machine-code': 'the bytes a CPU actually runs',
      'assembly-language': 'machine code written as text',
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
      'caller-callee-saved': 'which registers each side must preserve',
      'prologue-epilogue': 'the code that builds and tears down a frame',
    } },
    { n: 229, title: 'Code shape: lowering control flow and data', introduces: {
      'code-shape': 'the patterns a compiler uses to express each construct',
      'array-address-arithmetic': 'base + index × size',
      'jump-table': 'switch compiled to an indexed jump',
    } },
    { n: 230, title: 'Instruction selection by tree tiling', introduces: {
      'instruction-selection': 'choosing machine instructions for IR operations',
      'tree-tiling': 'covering an IR tree with instruction patterns',
      'optimal-tiling': 'the cheapest cover, found by dynamic programming',
    } },
    { n: 231, title: 'Leaving SSA', introduces: {
      'ssa-destruction': 'replacing phi nodes with copies',
      'parallel-copy': 'several copies that happen at once',
      'lost-copy-problem': 'the bug naive phi removal causes',
    } },
    { n: 232, title: 'Live ranges and interference', introduces: {
      'live-range': 'where a value is alive',
      'interference-graph': 'values that are alive at the same time, as a graph',
    } },
    { n: 233, title: 'Register allocation by graph colouring', introduces: {
      'register-allocation': 'deciding which values live in which registers',
      'graph-coloring': 'giving neighbours different colours',
      'simplify-select': 'Chaitin and Briggs’s colouring algorithm',
      coalescing: 'merging copies so they disappear',
    } },
    { n: 234, title: 'Spilling and linear scan', introduces: {
      spilling: 'keeping a value in memory when registers run out',
      'linear-scan': 'allocating registers in one pass over live intervals',
      'live-interval': 'a live range flattened to a start and an end',
    } },
    { n: 235, title: 'Instruction scheduling', introduces: {
      'instruction-scheduling': 'reordering instructions to keep the CPU busy',
      'dependence-dag': 'which instructions must wait for which',
      'list-scheduling': 'the greedy scheduling algorithm',
    } },
    { n: 236, title: 'Software pipelining', introduces: {
      'software-pipelining': 'overlapping iterations of a loop',
      'modulo-scheduling': 'one schedule repeated every few cycles',
    } },
    { n: 237, title: 'Peephole optimisation', introduces: {
      peephole: 'improving short windows of instructions',
      superoptimization: 'searching for the shortest correct sequence',
    } },
    { n: 238, title: 'Assemblers, object files and linking', introduces: {
      assembler: 'a program that turns assembly into machine code',
      'object-file': 'machine code plus symbols and relocations',
      relocation: 'a hole the linker fills with an address',
      linker: 'the program that joins object files',
      loader: 'the program that puts a binary in memory and runs it',
    } },
    { n: 239, title: 'A tiny JIT', introduces: {
      'runtime-code-generation': 'writing code while the program runs',
      'jit-from-scratch': 'a JIT that compiles hot Drip functions to WebAssembly',
    } },
    { n: 240, title: 'Drip to RISC-V, end to end', introduces: {
      'native-pipeline': 'source to native code through every stage',
    } },
    { n: 241, title: 'Real back ends: LLVM, clang and rustc', introduces: {
      'llvm-ir': 'LLVM’s typed SSA IR',
      'llvm-pass': 'a transformation over LLVM IR',
      'compiler-architecture-tour': 'how clang and rustc are put together',
    } },
  ],
};
