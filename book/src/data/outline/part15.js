export default {
  id: 'XV', section: 'deep', days: '25–32', title: 'Deep dive: implementing language features',
  blurb: 'How compilers implement objects and vtables, interfaces, generics, exceptions, pattern matching, sum types, generators, async, coroutines, tail calls, NaN-boxing, Unicode, modules, macros, overloading, desugaring, reference counting, a borrow checker in miniature, laziness, reflection, threads and atomics.',
  chapters: [
    { n: 265, title: 'Objects, vtables and dynamic dispatch', introduces: {
      vtable: 'a table of a class’s method addresses',
      'dynamic-dispatch': 'choosing the method at run time',
      'object-layout': 'where fields and the vtable pointer go',
    } },
    { n: 266, title: 'Interfaces and traits: dictionary passing', introduces: {
      'dictionary-passing': 'passing a table of operations as a hidden argument',
      itable: 'interface method tables',
      'fat-pointer': 'a data pointer plus a table pointer',
    } },
    { n: 267, title: 'Generics: specialisation or erasure', introduces: {
      'generic-specialization': 'compiling one copy of a generic per type',
      'generic-erasure': 'one copy for every type, through a uniform representation',
      boxing: 'putting a value behind a pointer so it fits a uniform slot',
    } },
    { n: 268, title: 'Closure conversion and lambda lifting', introduces: {
      'closure-conversion': 'turning closures into code plus an environment record',
      'lambda-lifting': 'turning nested functions into top-level ones with extra parameters',
    } },
    { n: 269, title: 'Exceptions and stack unwinding', introduces: {
      unwinding: 'walking the stack back to a handler',
      'landing-pad': 'the cleanup code unwinding jumps to',
      'zero-cost-exceptions': 'exceptions that cost nothing until thrown',
    } },
    { n: 270, title: 'Compiling pattern matching', introduces: {
      'decision-tree': 'nested tests that choose a match arm',
      'match-compilation': 'turning patterns into decision trees',
      'exhaustiveness-checking': 'proving every value is matched',
    } },
    { n: 271, title: 'Sum types in memory', introduces: {
      'tagged-union': 'a tag plus the largest variant',
      'niche-optimization': 'hiding the tag in unused bit patterns',
      'adt-layout': 'how algebraic data types are laid out',
    } },
    { n: 272, title: 'Generators as state machines', introduces: {
      'state-machine-lowering': 'turning a pausable function into a switch on a state number',
      'resumable-function': 'a function that can stop and continue',
    } },
    { n: 273, title: 'Lowering async/await', introduces: {
      'async-lowering': 'compiling async functions to state machines over promises',
      continuation: 'the rest of the computation, as a value',
      cps: 'continuation-passing style',
    } },
    { n: 274, title: 'Coroutines and green threads', introduces: {
      coroutine: 'a function that can suspend and be resumed',
      'stackful-vs-stackless': 'coroutines with their own stack, or without',
      'green-thread': 'a thread scheduled by the language, not the OS',
    } },
    { n: 275, title: 'Tail calls', introduces: {
      'tail-call': 'a call that is the last thing a function does',
      'tail-call-optimization': 'reusing the frame for a tail call',
      trampoline: 'a loop that runs tail calls without growing the stack',
    } },
    { n: 276, title: 'Strings and Unicode', introduces: {
      unicode: 'one number for every character in every script',
      'utf8-utf16': 'the two common ways to store Unicode',
      'grapheme-cluster': 'what a reader sees as one character',
      rope: 'a string stored as a tree of pieces',
    } },
    { n: 277, title: 'Modules and separate compilation', introduces: {
      'separate-compilation': 'compiling files independently and linking later',
      'name-mangling': 'encoding names so they are unique in object files',
    } },
    { n: 278, title: 'The module graph and build order', introduces: {
      'module-graph': 'the import graph, and the order to compile it in',
    } },
    { n: 279, title: 'Macros and hygiene', introduces: {
      'macro-expansion': 'code that writes code before compilation',
      quasiquote: 'a template of code with holes',
    } },
    { n: 280, title: 'Macro hygiene', introduces: {
      hygiene: 'macro names that cannot capture or be captured',
    } },
    { n: 281, title: 'Operators, sugar and desugaring', introduces: {
      'operator-overloading': 'user types with their own + and ==',
    } },
    { n: 282, title: 'Desugaring optional chaining and destructuring', introduces: {
      'optional-chaining-lowering': 'a?.b written with plain tests',
      'destructuring-lowering': 'const {a, b} = o written with plain reads',
    } },
    { n: 283, title: 'Reference counting', introduces: {
      'reference-counting': 'freeing an object when its count reaches zero',
    } },
    { n: 284, title: 'Cycle collection and eliding counts', introduces: {
      'cycle-collection': 'finding garbage cycles reference counting misses',
      'rc-elision': 'removing count updates the compiler can prove unnecessary',
    } },
    { n: 285, title: 'A borrow checker in miniature', introduces: {
      'borrow-checking-algorithm': 'how a compiler checks borrows',
    } },
    { n: 286, title: 'Non-lexical lifetimes and region inference', introduces: {
      'non-lexical-lifetimes': 'borrows that end at their last use',
      'region-inference': 'working out how long each borrow lives',
    } },
    { n: 287, title: 'Lazy evaluation', introduces: {
      thunk: 'a suspended computation',
      'call-by-need': 'evaluate once, when first needed',
    } },
    { n: 288, title: 'Strictness analysis', introduces: {
      'strictness-analysis': 'finding values that will be needed anyway',
    } },
    { n: 289, title: 'Reflection, eval and proxies', introduces: {
      reflection: 'a program inspecting its own structure',
      'runtime-type-info': 'type data kept for run time',
    } },
    { n: 290, title: 'Eval, with and proxies', introduces: {
      'eval-semantics': 'what eval and with cost an optimiser',
      proxy: 'an object whose operations are intercepted',
    } },
    { n: 291, title: 'Threads, memory models and atomics', introduces: {
      'data-race': 'two unsynchronised accesses, at least one a write',
      'memory-model': 'which reorderings threads may observe',
    } },
    { n: 292, title: 'Atomics and happens-before', introduces: {
      atomics: 'operations that are indivisible and ordered',
      'happens-before': 'the ordering a memory model guarantees',
    } },
  ],
};
