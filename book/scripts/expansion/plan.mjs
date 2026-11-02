// The 2026-11 expansion: new chapters, by where they go in the old (1–200)
// numbering. `after` is the old chapter they follow. Applied once by
// scripts/expansion/apply.mjs; kept as the record of what was added and why.
//
// New parts get their own outline file; everything else joins an existing part.
export const NEW_PARTS = [
  // Inserted after old Part VI (the middle end).
  {
    after: 88, file: 'part-backend.js', track: 'A',
    title: 'A native back end',
    blurb: 'Machine code, RISC-V assembly, calling conventions, instruction selection, register allocation, scheduling, linking and a tiny JIT: everything between an IR and a running binary.',
  },
  // Inserted after old Part VIII (the end of Track A).
  {
    after: 120, file: 'part-features.js', track: 'A',
    title: 'Implementing language features',
    blurb: 'How real languages implement objects, traits, generics, exceptions, pattern matching, generators, async, closures, Unicode strings, macros, reference counting, borrow checking, concurrency and modern garbage collectors.',
  },
];

export const INSERTS = [
  // ── Part I: TypeScript, all the way ───────────────────────────────────────
  { after: 16, part: 'I', chapters: [
    { title: 'TypeScript III: generics in depth', introduces: {
      'generic-constraint': 'limiting a type parameter with extends', 'generic-inference': 'TypeScript working out type arguments from the call',
      'generic-default': 'a type parameter with a fallback type' } },
    { title: 'TypeScript IV: computing with types', introduces: {
      keyof: 'the union of an object type’s keys', 'indexed-access-type': 'T[K]: the type of one property', 'mapped-type': '{ [K in keyof T]: ... }: a type built key by key',
      'conditional-type': 'T extends U ? X : Y', 'template-literal-type': 'string types built from patterns', 'utility-types': 'Partial, Pick, Omit, Record and friends' } },
    { title: 'Iterators and generators', introduces: {
      'iterator-protocol': 'next() returning { value, done }', generator: 'a function* that can pause', yield: 'pausing a generator and handing out a value',
      'lazy-sequence': 'values produced only when asked for' } },
    { title: 'Asynchronous code: promises and the event loop', introduces: {
      promise: 'a value that will be ready later', 'async-await': 'writing promise code as if it were sequential', 'event-loop': 'the loop that runs callbacks one at a time',
      microtask: 'the queue promise callbacks wait in' } },
    { title: 'The toolchain: tsconfig, modules and npm', introduces: {
      tsconfig: 'the file that configures the TypeScript compiler', 'strict-mode-ts': 'the strict compiler options and why to turn them on',
      'package-json': 'a package’s name, version, scripts and dependencies', bundler: 'a tool that joins modules into files to ship' } },
    { title: 'Designing with types', introduces: {
      'type-driven-design': 'choosing types first so the code follows', 'branded-type': 'a nominal tag on a structural type',
      'illegal-states-unrepresentable': 'types that make wrong data impossible to build' } },
    { title: 'Checkpoint: a JSON parser in TypeScript', introduces: {
      json: 'the JSON data format', 'checkpoint-ts': 'a whole TypeScript program, written without the book’s scaffolding' } },
  ] },

  // ── Part III: regular languages ──────────────────────────────────────────
  { after: 29, part: 'III', chapters: [
    { title: 'Regular expressions as a language', introduces: {
      'regular-expression': 'a pattern built from characters, choice, sequence and repetition', 'regex-operators': 'concatenation, alternation (|) and Kleene star (*)',
      'regular-language': 'the set of strings a regular expression matches' } },
    { title: 'Finite automata', introduces: {
      'finite-automaton': 'a machine with finitely many states that reads one character at a time', dfa: 'a deterministic finite automaton: one next state per character',
      nfa: 'a nondeterministic finite automaton: several possible next states, and ε-moves', 'accepting-state': 'a state where the input so far is a match' } },
    { title: 'From regular expressions to fast scanners', introduces: {
      'thompson-construction': 'building an NFA from a regular expression, piece by piece', 'subset-construction': 'turning an NFA into a DFA by tracking sets of states',
      'dfa-minimization': 'merging DFA states that behave the same', 'scanner-generator': 'a tool (like lex) that writes a scanner from regular expressions' } },
  ] },

  // ── Part III: grammars, derivations, ambiguity ───────────────────────────
  { after: 30, part: 'III', chapters: [
    { title: 'Derivations, parse trees and ambiguity', introduces: {
      derivation: 'rewriting the start symbol, one rule at a time, into a sentence', 'parse-tree': 'the tree a derivation draws',
      ambiguity: 'one sentence with two different parse trees', 'chomsky-hierarchy': 'regular, context-free, context-sensitive and unrestricted grammars' } },
  ] },

  // ── Part III: parsing theory ─────────────────────────────────────────────
  { after: 34, part: 'III', chapters: [
    { title: 'FIRST, FOLLOW and LL(1)', introduces: {
      'first-set': 'the tokens a rule can start with', 'follow-set': 'the tokens that can come after a nonterminal',
      'll1-table': 'a table that picks the rule from one token of lookahead', 'left-recursion-elimination': 'rewriting A → A x so a top-down parser can use it' } },
    { title: 'Bottom-up parsing: shift and reduce', introduces: {
      'shift-reduce': 'parsing by pushing tokens and replacing rule bodies with their heads', 'lr-handle': 'the part of the stack that should be reduced next',
      'bottom-up-parsing': 'building the parse tree from the leaves up' } },
    { title: 'LR(0) items and the LR automaton', introduces: {
      'lr0-item': 'a rule with a dot showing how much has been seen', 'closure-goto': 'the two operations that build LR states',
      'lr-automaton': 'the DFA over items that drives an LR parser', 'lr-conflict': 'shift/reduce and reduce/reduce conflicts' } },
    { title: 'SLR, LALR and LR(1)', introduces: {
      slr: 'LR(0) states with FOLLOW sets for lookahead', lr1: 'items that carry their own lookahead token',
      lalr: 'LR(1) states merged when their cores match', 'lookahead-set': 'the tokens that allow a reduction' } },
    { title: 'Parser generators, PEG, GLR and incremental parsing', introduces: {
      'parser-generator': 'a tool that builds a parser from a grammar', peg: 'parsing expression grammars: ordered choice',
      glr: 'generalised LR: following every choice at once', 'incremental-parsing': 'reparsing only what an edit changed' } },
  ] },

  // ── Part III: meaning and types ──────────────────────────────────────────
  { after: 44, part: 'III', chapters: [
    { title: 'Syntax-directed translation and attribute grammars', introduces: {
      'syntax-directed-translation': 'attaching actions to grammar rules', 'attribute-grammar': 'a grammar whose nodes carry computed values',
      'synthesized-attribute': 'a value computed from a node’s children', 'inherited-attribute': 'a value passed down from a node’s parent' } },
    { title: 'The lambda calculus', introduces: {
      'lambda-calculus': 'a whole language made of functions and nothing else', 'beta-reduction': 'applying a function by substituting its argument',
      substitution: 'replacing a variable, carefully, without capturing names', 'free-and-bound-variables': 'variables defined outside and inside a function' } },
    { title: 'Operational semantics', introduces: {
      'operational-semantics': 'defining a language by rules for how programs run', 'small-step-semantics': 'one tiny step of evaluation at a time',
      'big-step-semantics': 'an expression and its final value in one rule' } },
    { title: 'What a type system promises', introduces: {
      'type-system': 'rules that classify program pieces by the values they produce', 'static-vs-dynamic-typing': 'checking types before running, or while running',
      'type-error': 'an operation applied to the wrong kind of value', 'type-soundness-intro': 'the promise that well-typed programs do not go wrong' } },
    { title: 'Reading typing rules', introduces: {
      'typing-judgment': 'Γ ⊢ e : T, read “in context Γ, e has type T”', 'inference-rule': 'premises above a line, a conclusion below it',
      'type-environment': 'Γ: the types of the names in scope' } },
    { title: 'A type checker for typed Drip', introduces: {
      'type-checker': 'a pass that applies the typing rules to a program', 'typed-drip': 'Drip with optional type annotations',
      'type-annotation-checking': 'comparing declared types with computed ones' } },
    { title: 'Unification', introduces: {
      'type-variable': 'a placeholder for a type not yet known', unification: 'solving equations between types', 'occurs-check': 'refusing to solve α = List<α>' } },
    { title: 'Hindley–Milner type inference', introduces: {
      'hindley-milner': 'complete type inference for a language with let-polymorphism', 'let-polymorphism': 'a let-bound function used at several types',
      generalization: 'turning leftover type variables into ∀', instantiation: 'giving a ∀ type fresh variables at each use' } },
    { title: 'Subtyping and variance', introduces: {
      subtyping: 'S <: T: an S can be used wherever a T is expected', 'structural-vs-nominal': 'compatible by shape, or by declared name',
      variance: 'how subtyping of parts carries to wholes: co-, contra- and invariance' } },
    { title: 'Bidirectional checking and soundness', introduces: {
      'bidirectional-typing': 'checking mode and synthesis mode', soundness: 'progress and preservation, stated and proved',
      'progress-preservation': 'well-typed terms step, and stay well-typed', 'unsound-by-design': 'where TypeScript chose convenience over soundness' } },
    { title: 'Beyond: System F, dependent and linear types', introduces: {
      'system-f': 'the polymorphic lambda calculus', 'dependent-types': 'types that mention values',
      'linear-types': 'values that must be used exactly once', 'effect-systems': 'types that track what code may do' } },
  ] },

  // ── Part VI: the middle end, completed ───────────────────────────────────
  { after: 79, part: 'VI', chapters: [
    { title: 'The classic dataflow problems', introduces: {
      'reaching-definitions': 'which assignments may reach a point', 'available-expressions': 'which computations are already done on every path',
      'very-busy-expressions': 'which computations every path will do next', 'gen-kill': 'describing a block by what it creates and destroys' } },
    { title: 'Lattices and abstract interpretation', introduces: {
      'abstract-interpretation': 'running a program on abstract values to learn facts', 'abstract-domain': 'the set of abstract values and how they combine',
      'monotone-framework': 'dataflow as monotone functions on a lattice', widening: 'jumping ahead so a loop analysis finishes' } },
  ] },
  { after: 81, part: 'VI', chapters: [
    { title: 'Value numbering and common subexpressions', introduces: {
      'value-numbering': 'giving equal computations the same number', cse: 'reusing a value instead of recomputing it',
      gvn: 'value numbering across a whole function' } },
    { title: 'Partial redundancy elimination', introduces: {
      pre: 'removing computations that are redundant on some paths', 'anticipable-expressions': 'computations that will certainly happen later',
      'lazy-code-motion': 'placing computations as late as is still safe', 'critical-edge': 'an edge whose source has many successors and target many predecessors' } },
  ] },
  { after: 83, part: 'VI', chapters: [
    { title: 'Loop-invariant code motion and strength reduction', introduces: {
      licm: 'hoisting loop-invariant work out of the loop', 'strength-reduction': 'replacing a multiply by a running add',
      'induction-variable-elimination': 'removing counters that others can replace', 'loop-preheader': 'a block added just before a loop' } },
    { title: 'Loop transformations and vectorisation', introduces: {
      'dependence-analysis': 'which iterations depend on which', 'loop-unrolling': 'doing several iterations per trip',
      'loop-interchange-fusion': 'swapping nested loops and merging adjacent ones', 'auto-vectorization': 'the compiler writing SIMD for you' } },
    { title: 'Locality, tiling and the polyhedral model', introduces: {
      'loop-tiling': 'cutting loops into cache-sized blocks', 'polyhedral-model': 'loop nests as points in a shape, transformed with matrices',
      'affine-access': 'array indices that are linear in the loop counters' } },
  ] },
  { after: 84, part: 'VI', chapters: [
    { title: 'Interprocedural analysis', introduces: {
      'interprocedural-analysis': 'analysis across function boundaries', 'context-sensitivity': 'analysing a function separately for each kind of caller',
      'function-summary': 'what a function does, recorded once and reused', 'datalog-analysis': 'program analyses written as logic rules' } },
  ] },
  { after: 86, part: 'VI', chapters: [
    { title: 'Sea of nodes and other IR designs', introduces: {
      'sea-of-nodes': 'an IR where only data and control dependencies order instructions', 'graph-ir': 'IRs as graphs instead of lists',
      'mlir-dialects': 'many small IRs, lowered step by step' } },
  ] },

  // ── New part: a native back end ──────────────────────────────────────────
  { after: 88, newPart: 'part-backend.js', chapters: [
    { title: 'Machine code and assembly', introduces: {
      'machine-code': 'the bytes a CPU actually runs', 'assembly-language': 'machine code written as text', isa: 'instruction set architecture: the contract between hardware and software',
      'risc-v': 'a small, open instruction set' } },
    { title: 'RISC-V: registers, memory and the stack', introduces: {
      'load-store': 'only loads and stores touch memory', 'addressing-mode': 'how an instruction names a memory location',
      'stack-pointer': 'the register that marks the top of the stack' } },
    { title: 'Calling conventions and the ABI', introduces: {
      'calling-convention': 'where arguments, results and the return address go', abi: 'application binary interface: the rules compiled code agrees on',
      'caller-callee-saved': 'which registers each side must preserve', 'prologue-epilogue': 'the code that builds and tears down a frame' } },
    { title: 'Code shape: lowering control flow and data', introduces: {
      'code-shape': 'the patterns a compiler uses to express each construct', 'array-address-arithmetic': 'base + index × size',
      'jump-table': 'switch compiled to an indexed jump' } },
    { title: 'Instruction selection by tree tiling', introduces: {
      'instruction-selection': 'choosing machine instructions for IR operations', 'tree-tiling': 'covering an IR tree with instruction patterns',
      'optimal-tiling': 'the cheapest cover, found by dynamic programming' } },
    { title: 'Leaving SSA', introduces: {
      'ssa-destruction': 'replacing phi nodes with copies', 'parallel-copy': 'several copies that happen at once',
      'lost-copy-problem': 'the bug naive phi removal causes' } },
    { title: 'Live ranges and interference', introduces: {
      'live-range': 'where a value is alive', 'interference-graph': 'values that are alive at the same time, as a graph' } },
    { title: 'Register allocation by graph colouring', introduces: {
      'register-allocation': 'deciding which values live in which registers', 'graph-coloring': 'giving neighbours different colours',
      'simplify-select': 'Chaitin and Briggs’s colouring algorithm', coalescing: 'merging copies so they disappear' } },
    { title: 'Spilling and linear scan', introduces: {
      spilling: 'keeping a value in memory when registers run out', 'linear-scan': 'allocating registers in one pass over live intervals',
      'live-interval': 'a live range flattened to a start and an end' } },
    { title: 'Instruction scheduling', introduces: {
      'instruction-scheduling': 'reordering instructions to keep the CPU busy', 'dependence-dag': 'which instructions must wait for which',
      'list-scheduling': 'the greedy scheduling algorithm' } },
    { title: 'Software pipelining', introduces: {
      'software-pipelining': 'overlapping iterations of a loop', 'modulo-scheduling': 'one schedule repeated every few cycles' } },
    { title: 'Peephole optimisation', introduces: {
      peephole: 'improving short windows of instructions', superoptimization: 'searching for the shortest correct sequence' } },
    { title: 'Assemblers, object files and linking', introduces: {
      assembler: 'a program that turns assembly into machine code', 'object-file': 'machine code plus symbols and relocations',
      relocation: 'a hole the linker fills with an address', linker: 'the program that joins object files', loader: 'the program that puts a binary in memory and runs it' } },
    { title: 'A tiny JIT', introduces: {
      'runtime-code-generation': 'writing code while the program runs', 'jit-from-scratch': 'a JIT that compiles hot Drip functions to WebAssembly' } },
    { title: 'Drip to RISC-V, end to end', introduces: {
      'native-pipeline': 'source to native code through every stage' } },
    { title: 'Real back ends: LLVM, clang and rustc', introduces: {
      'llvm-ir': 'LLVM’s typed SSA IR', 'llvm-pass': 'a transformation over LLVM IR', 'compiler-architecture-tour': 'how clang and rustc are put together' } },
  ] },

  // ── New part: implementing language features ─────────────────────────────
  { after: 120, newPart: 'part-features.js', chapters: [
    { title: 'Objects, vtables and dynamic dispatch', introduces: {
      vtable: 'a table of a class’s method addresses', 'dynamic-dispatch': 'choosing the method at run time', 'object-layout': 'where fields and the vtable pointer go' } },
    { title: 'Interfaces and traits: dictionary passing', introduces: {
      'dictionary-passing': 'passing a table of operations as a hidden argument', itable: 'interface method tables', 'fat-pointer': 'a data pointer plus a table pointer' } },
    { title: 'Generics: specialisation or erasure', introduces: {
      'generic-specialization': 'compiling one copy of a generic per type', 'generic-erasure': 'one copy for every type, through a uniform representation',
      boxing: 'putting a value behind a pointer so it fits a uniform slot' } },
    { title: 'Closure conversion and lambda lifting', introduces: {
      'closure-conversion': 'turning closures into code plus an environment record', 'lambda-lifting': 'turning nested functions into top-level ones with extra parameters' } },
    { title: 'Exceptions and stack unwinding', introduces: {
      unwinding: 'walking the stack back to a handler', 'landing-pad': 'the cleanup code unwinding jumps to',
      'zero-cost-exceptions': 'exceptions that cost nothing until thrown' } },
    { title: 'Compiling pattern matching', introduces: {
      'decision-tree': 'nested tests that choose a match arm', 'match-compilation': 'turning patterns into decision trees',
      'exhaustiveness-checking': 'proving every value is matched' } },
    { title: 'Sum types in memory', introduces: {
      'tagged-union': 'a tag plus the largest variant', 'niche-optimization': 'hiding the tag in unused bit patterns', 'adt-layout': 'how algebraic data types are laid out' } },
    { title: 'Generators as state machines', introduces: {
      'state-machine-lowering': 'turning a pausable function into a switch on a state number', 'resumable-function': 'a function that can stop and continue' } },
    { title: 'Lowering async/await', introduces: {
      'async-lowering': 'compiling async functions to state machines over promises', continuation: 'the rest of the computation, as a value', cps: 'continuation-passing style' } },
    { title: 'Coroutines and green threads', introduces: {
      coroutine: 'a function that can suspend and be resumed', 'stackful-vs-stackless': 'coroutines with their own stack, or without', 'green-thread': 'a thread scheduled by the language, not the OS' } },
    { title: 'Tail calls', introduces: {
      'tail-call': 'a call that is the last thing a function does', 'tail-call-optimization': 'reusing the frame for a tail call', trampoline: 'a loop that runs tail calls without growing the stack' } },
    { title: 'Strings and Unicode', introduces: {
      unicode: 'one number for every character in every script', 'utf8-utf16': 'the two common ways to store Unicode',
      'grapheme-cluster': 'what a reader sees as one character', rope: 'a string stored as a tree of pieces' } },
    { title: 'Modules and separate compilation', introduces: {
      'separate-compilation': 'compiling files independently and linking later', 'name-mangling': 'encoding names so they are unique in object files',
      'module-graph': 'the import graph, and the order to compile it in' } },
    { title: 'Macros and hygiene', introduces: {
      'macro-expansion': 'code that writes code before compilation', hygiene: 'macro names that cannot capture or be captured', quasiquote: 'a template of code with holes' } },
    { title: 'Operators, sugar and desugaring', introduces: {
      'operator-overloading': 'user types with their own + and ==', 'optional-chaining-lowering': 'a?.b written with plain tests',
      'destructuring-lowering': 'const {a, b} = o written with plain reads' } },
    { title: 'Reference counting', introduces: {
      'reference-counting': 'freeing an object when its count reaches zero', 'cycle-collection': 'finding garbage cycles reference counting misses',
      'rc-elision': 'removing count updates the compiler can prove unnecessary' } },
    { title: 'A borrow checker in miniature', introduces: {
      'borrow-checking-algorithm': 'how a compiler checks borrows', 'non-lexical-lifetimes': 'borrows that end at their last use',
      'region-inference': 'working out how long each borrow lives' } },
    { title: 'Lazy evaluation', introduces: {
      thunk: 'a suspended computation', 'call-by-need': 'evaluate once, when first needed', 'strictness-analysis': 'finding values that will be needed anyway' } },
    { title: 'Reflection, eval and proxies', introduces: {
      reflection: 'a program inspecting its own structure', 'runtime-type-info': 'type data kept for run time',
      'eval-semantics': 'what eval and with cost an optimiser', proxy: 'an object whose operations are intercepted' } },
    { title: 'Threads, memory models and atomics', introduces: {
      'memory-model': 'which reorderings threads may observe', 'data-race': 'two unsynchronised accesses, at least one a write',
      atomics: 'operations that are indivisible and ordered', 'happens-before': 'the ordering a memory model guarantees' } },
    { title: 'Copying collection', introduces: {
      'copying-gc': 'collecting by copying live objects to a fresh space', 'cheney-scan': 'breadth-first copying with two pointers', 'forwarding-pointer': 'where a moved object now lives' } },
    { title: 'Generational collection in depth', introduces: {
      'remembered-set': 'old-to-young pointers the collector must know about', 'card-table': 'a coarse map of dirty memory', nursery: 'the space new objects are born in' } },
    { title: 'Incremental and concurrent collection', introduces: {
      'incremental-gc': 'collecting in small slices between program work', 'concurrent-gc': 'collecting while the program runs',
      'snapshot-at-the-beginning': 'a barrier that preserves the start-of-cycle view', 'read-barrier': 'a check on every pointer read' } },
    { title: 'Allocation, compaction and real collectors', introduces: {
      'bump-allocation': 'allocating by moving a pointer', 'free-list': 'a list of free blocks', 'sliding-compaction': 'moving live objects together, in order',
      'collector-design-space': 'how V8, the JVM, Go and .NET choose', 'weak-reference': 'a pointer the collector may clear',
      finalization: 'running code when an object dies, and why it is fragile' } },
  ] },

  // ── Part IX: Rust, all the way ───────────────────────────────────────────
  { after: 144, part: 'IX', chapters: [
    { title: 'Patterns in depth', introduces: {
      'binding-modes': 'by value, by ref and by ref mut in patterns', 'match-guard': 'an if on a match arm', 'pattern-syntax': 'ranges, @ bindings, nested and slice patterns' } },
    { title: 'Trait objects and dispatch', introduces: {
      'dyn-dispatch-cost': 'what a vtable call costs compared with a generic', 'object-safety': 'which traits can be trait objects' } },
    { title: 'Associated types and the standard traits', introduces: {
      'associated-type': 'a type a trait implementation chooses', 'std-traits': 'Display, Debug, Default, Clone, From, Iterator and friends',
      'operator-traits': 'Add, Index and the other operator traits', derive: '#[derive] writing standard impls for you' } },
    { title: 'Threads, Send and Sync', introduces: {
      'rust-thread': 'std::thread::spawn and scoped threads', 'send-sync': 'the marker traits that make data races compile errors',
      'arc-mutex': 'shared ownership across threads, with locking', channel: 'sending values between threads' } },
    { title: 'Data parallelism with rayon', introduces: {
      rayon: 'a crate that parallelises iterators', 'work-stealing': 'idle threads taking work from busy ones' } },
    { title: 'Async Rust', introduces: {
      future: 'a value that can be polled until it is ready', 'async-rust': 'async fn and .await in Rust', executor: 'the runtime that polls futures (Tokio)' } },
    { title: 'Macros: declarative and procedural', introduces: {
      'macro-rules': 'pattern-matching macros', 'proc-macro': 'a Rust function that writes Rust code', 'token-stream': 'what a procedural macro reads and writes' } },
    { title: 'FFI and unsafe boundaries', introduces: {
      ffi: 'calling C from Rust and Rust from C', 'extern-c': 'the C calling convention in Rust', 'safety-invariant': 'what unsafe code must promise to its callers' } },
    { title: 'Designing Rust APIs and the Cargo workflow', introduces: {
      'api-design': 'the Rust API guidelines in practice', 'cargo-features': 'optional parts of a crate', rustdoc: 'documentation and doc tests', clippy: 'the Rust linter' } },
    { title: 'Checkpoint: a concurrent file indexer in Rust', introduces: {
      'checkpoint-rust': 'a whole Rust program, written without the book’s scaffolding' } },
  ] },
];
