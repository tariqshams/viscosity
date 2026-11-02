// Implementing language features. Added in the 2026-11 expansion (scripts/expansion/plan.mjs).
export default {
  id: 'X', track: 'A', days: '63–69', title: 'Implementing language features',
  blurb: 'How real languages implement objects, traits, generics, exceptions, pattern matching, generators, async, closures, Unicode strings, macros, reference counting, borrow checking, concurrency and modern garbage collectors.',
  chapters: [
    { n: 251, title: 'Objects, vtables and dynamic dispatch', introduces: {
      vtable: 'a table of a class’s method addresses',
      'dynamic-dispatch': 'choosing the method at run time',
      'object-layout': 'where fields and the vtable pointer go',
    } },
    { n: 252, title: 'Interfaces and traits: dictionary passing', introduces: {
      'dictionary-passing': 'passing a table of operations as a hidden argument',
      itable: 'interface method tables',
      'fat-pointer': 'a data pointer plus a table pointer',
    } },
    { n: 253, title: 'Generics: specialisation or erasure', introduces: {
      'generic-specialization': 'compiling one copy of a generic per type',
      'generic-erasure': 'one copy for every type, through a uniform representation',
      boxing: 'putting a value behind a pointer so it fits a uniform slot',
    } },
    { n: 254, title: 'Closure conversion and lambda lifting', introduces: {
      'closure-conversion': 'turning closures into code plus an environment record',
      'lambda-lifting': 'turning nested functions into top-level ones with extra parameters',
    } },
    { n: 255, title: 'Exceptions and stack unwinding', introduces: {
      unwinding: 'walking the stack back to a handler',
      'landing-pad': 'the cleanup code unwinding jumps to',
      'zero-cost-exceptions': 'exceptions that cost nothing until thrown',
    } },
    { n: 256, title: 'Compiling pattern matching', introduces: {
      'decision-tree': 'nested tests that choose a match arm',
      'match-compilation': 'turning patterns into decision trees',
      'exhaustiveness-checking': 'proving every value is matched',
    } },
    { n: 257, title: 'Sum types in memory', introduces: {
      'tagged-union': 'a tag plus the largest variant',
      'niche-optimization': 'hiding the tag in unused bit patterns',
      'adt-layout': 'how algebraic data types are laid out',
    } },
    { n: 258, title: 'Generators as state machines', introduces: {
      'state-machine-lowering': 'turning a pausable function into a switch on a state number',
      'resumable-function': 'a function that can stop and continue',
    } },
    { n: 259, title: 'Lowering async/await', introduces: {
      'async-lowering': 'compiling async functions to state machines over promises',
      continuation: 'the rest of the computation, as a value',
      cps: 'continuation-passing style',
    } },
    { n: 260, title: 'Coroutines and green threads', introduces: {
      coroutine: 'a function that can suspend and be resumed',
      'stackful-vs-stackless': 'coroutines with their own stack, or without',
      'green-thread': 'a thread scheduled by the language, not the OS',
    } },
    { n: 261, title: 'Tail calls', introduces: {
      'tail-call': 'a call that is the last thing a function does',
      'tail-call-optimization': 'reusing the frame for a tail call',
      trampoline: 'a loop that runs tail calls without growing the stack',
    } },
    { n: 262, title: 'Strings and Unicode', introduces: {
      unicode: 'one number for every character in every script',
      'utf8-utf16': 'the two common ways to store Unicode',
      'grapheme-cluster': 'what a reader sees as one character',
      rope: 'a string stored as a tree of pieces',
    } },
    { n: 263, title: 'Modules and separate compilation', introduces: {
      'separate-compilation': 'compiling files independently and linking later',
      'name-mangling': 'encoding names so they are unique in object files',
      'module-graph': 'the import graph, and the order to compile it in',
    } },
    { n: 264, title: 'Macros and hygiene', introduces: {
      'macro-expansion': 'code that writes code before compilation',
      hygiene: 'macro names that cannot capture or be captured',
      quasiquote: 'a template of code with holes',
    } },
    { n: 265, title: 'Operators, sugar and desugaring', introduces: {
      'operator-overloading': 'user types with their own + and ==',
      'optional-chaining-lowering': 'a?.b written with plain tests',
      'destructuring-lowering': 'const {a, b} = o written with plain reads',
    } },
    { n: 266, title: 'Reference counting', introduces: {
      'reference-counting': 'freeing an object when its count reaches zero',
      'cycle-collection': 'finding garbage cycles reference counting misses',
      'rc-elision': 'removing count updates the compiler can prove unnecessary',
    } },
    { n: 267, title: 'A borrow checker in miniature', introduces: {
      'borrow-checking-algorithm': 'how a compiler checks borrows',
      'non-lexical-lifetimes': 'borrows that end at their last use',
      'region-inference': 'working out how long each borrow lives',
    } },
    { n: 268, title: 'Lazy evaluation', introduces: {
      thunk: 'a suspended computation',
      'call-by-need': 'evaluate once, when first needed',
      'strictness-analysis': 'finding values that will be needed anyway',
    } },
    { n: 269, title: 'Reflection, eval and proxies', introduces: {
      reflection: 'a program inspecting its own structure',
      'runtime-type-info': 'type data kept for run time',
      'eval-semantics': 'what eval and with cost an optimiser',
      proxy: 'an object whose operations are intercepted',
    } },
    { n: 270, title: 'Threads, memory models and atomics', introduces: {
      'memory-model': 'which reorderings threads may observe',
      'data-race': 'two unsynchronised accesses, at least one a write',
      atomics: 'operations that are indivisible and ordered',
      'happens-before': 'the ordering a memory model guarantees',
    } },
    { n: 271, title: 'Copying collection', introduces: {
      'copying-gc': 'collecting by copying live objects to a fresh space',
      'cheney-scan': 'breadth-first copying with two pointers',
      'forwarding-pointer': 'where a moved object now lives',
    } },
    { n: 272, title: 'Generational collection in depth', introduces: {
      'remembered-set': 'old-to-young pointers the collector must know about',
      'card-table': 'a coarse map of dirty memory',
      nursery: 'the space new objects are born in',
    } },
    { n: 273, title: 'Incremental and concurrent collection', introduces: {
      'incremental-gc': 'collecting in small slices between program work',
      'concurrent-gc': 'collecting while the program runs',
      'snapshot-at-the-beginning': 'a barrier that preserves the start-of-cycle view',
      'read-barrier': 'a check on every pointer read',
    } },
    { n: 274, title: 'Allocation, compaction and real collectors', introduces: {
      'bump-allocation': 'allocating by moving a pointer',
      'free-list': 'a list of free blocks',
      'sliding-compaction': 'moving live objects together, in order',
      'collector-design-space': 'how V8, the JVM, Go and .NET choose',
      'weak-reference': 'a pointer the collector may clear',
      finalization: 'running code when an object dies, and why it is fragile',
    } },
  ],
};
