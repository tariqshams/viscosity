export default {
  id: 'VIII', section: 'core', days: '23–25', title: 'Core 7: Drip in Rust',
  blurb: 'drip-rs, the Drip VM ported to Rust: the scanner, bytecode and the VM loop, a Pratt compiler, heap objects in an arena, variables, frames and upvalues, a garbage collector, objects, errors, and three implementations measured.',
  chapters: [
    { n: 137, title: 'Planning drip-rs', introduces: {
      'drip-rs': 'the Rust implementation of Drip',
    } },
    { n: 138, title: 'Tokens and the scanner in Rust', introduces: {
      'token-enum': 'token types as a Rust enum',
      'byte-scanning': 'scanning &[u8] instead of chars',
    } },
    { n: 139, title: 'Bytecode, values and the VM loop in Rust', introduces: {
      'opcode-enum': '#[repr(u8)] opcodes',
      'value-enum': 'a Value enum and its size',
      'match-dispatch': 'a match-based dispatch loop',
    } },
    { n: 140, title: 'A Pratt compiler in Rust', introduces: {
      'parse-rule-table': 'a table of prefix/infix parse functions',
      'compiler-state': 'threading compiler state through &mut self',
    } },
    { n: 141, title: 'Heap objects in an arena', introduces: {
      'object-handle': 'a typed index standing for a heap object',
      'rust-vm-list': 'a Drip list as a Vec<Value> behind an arena handle, traced by the collector',
      'string-interner': 'a table mapping strings to ids',
    } },
    { n: 142, title: 'Variables, branches and loops in Rust', introduces: {
      'rust-locals': 'compile-time locals in the Rust compiler',
      'patch-jump': 'backpatching jumps in Rust',
    } },
    { n: 143, title: 'Call frames and upvalues in Rust', introduces: {
      'frame-stack': 'a Vec of call frames',
      'upvalue-handle': 'upvalues as arena handles',
    } },
    { n: 144, title: 'A garbage collector in Rust', introduces: {
      'arena-gc': 'mark and sweep over an arena with a free list',
    } },
    { n: 145, title: 'Objects, methods and inheritance in Rust', introduces: {
      'rust-instances': 'instances and field tables in the Rust VM',
      'rust-bound-method': 'bound methods in the Rust VM',
      'method-copy-down': 'copying inherited methods into the subclass',
    } },
    { n: 146, title: 'Errors, diagnostics and the shared corpus', introduces: {
      'runtime-stack-trace': 'reporting where a runtime error happened',
      'shared-corpus': 'one set of test programs for every implementation',
    } },
    { n: 147, title: 'Profiling and optimising drip-rs, and three implementations compared', introduces: {
      profiling: 'measuring where time goes',
      flamegraph: 'a picture of where time goes',
      'unchecked-indexing': 'skipping bounds checks safely',
      'implementation-comparison': 'the same programs on three implementations',
      'rust-tradeoffs': 'what Rust gave and what it cost',
    } },
  ],
};
