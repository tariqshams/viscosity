// New references for chapter 278 (Exceptions and stack unwinding).
// Checked 2026-11-02 by reading the raw source files named in each
// checkedAgainst from GitHub (raw.githubusercontent.com) in the writing
// session; the project web sites themselves (itanium-cxx-abi.github.io,
// llvm.org, docs.oracle.com) could not be reached from the session. The
// compiler output the chapter quotes was produced in the same session:
// clang 18.1.3 (-O2 -S -emit-llvm, and --target=riscv64-linux-gnu -O2 -S),
// javac/javap 21.0.12, Python 3.13.18 (dis) and Node 22.23.4
// (--print-bytecode).
export default [
  {
    id: 'itanium-cxx-abi-eh',
    authors: ['CodeSourcery, Compaq, EDG, HP, IBM, Intel, Red Hat, SGI, et al.'],
    title: 'Itanium C++ ABI: Exception Handling',
    venue: 'itanium-cxx-abi/cxx-abi, abi-eh.html ($Revision: 1.22 $)',
    year: null,
    doi: null,
    url: 'https://itanium-cxx-abi.github.io/cxx-abi/abi-eh.html',
    accessed: '2026-11-02',
    checkedAgainst: 'abi-eh.html read raw from github.com/itanium-cxx-abi/cxx-abi (main, commit fae5e46c8614) on 2026-11-02. Definition of landing pad: “A section of user code intended to catch, or otherwise clean up after, an exception. It gains control from the exception runtime via the personality routine, and after doing the appropriate processing either merges into the normal user code or returns to the runtime by resuming or raising a new exception.” Section 1.3: “The runtime framework then starts a two-phase process: In the search phase, the framework repeatedly calls the personality routine, with the _UA_SEARCH_PHASE flag … until the personality routine reports either success (a handler found in the queried frame) or failure (no handler) in all frames. It does not actually restore the unwound state … If the search phase reports failure, e.g. because no handler was found, it will call terminate() rather than commence phase 2. If the search phase reports success, the framework restarts in the cleanup phase … until it gets to the frame with an identified handler.”',
    shaped: 'Chapter 278: the definition of a landing pad, the two-phase (search, then cleanup) unwinding model, and terminate() when no handler exists.',
  },
  {
    id: 'llvm-exception-handling',
    authors: ['The LLVM Project'],
    title: 'Exception Handling in LLVM',
    venue: 'LLVM documentation (llvm/docs/ExceptionHandling.md)',
    year: null,
    doi: null,
    url: 'https://llvm.org/docs/ExceptionHandling.html',
    accessed: '2026-11-02',
    checkedAgainst: 'llvm/docs/ExceptionHandling.md read raw from github.com/llvm/llvm-project (main, commit 81d345fc0e23) on 2026-11-02. “Itanium ABI Zero-cost Exception Handling”: exception handling “should not interfere with the main flow of an application’s algorithm by performing checkpointing tasks, such as saving the current pc or register state”, and the Itanium specification provides “outlying data in the form of exception tables … Thus, the specification is said to add ‘zero-cost’ to the normal execution of an application.” “Setjmp/Longjmp Exception Handling”: each function doing exception processing “registers itself on a global frame list”. “Try/Catch”: the front end “replaces the call with an invoke instruction. Unlike a call, the invoke has two potential continuation points … The term used to define the place where an invoke continues after an exception is called a landing pad.” clang 18.1.3 output for the chapter’s load and safe functions showed invoke … unwind label, landingpad { ptr, i32 } cleanup / catch ptr @_ZTIi, and resume.',
    shaped: 'Chapter 278: invoke and landingpad in LLVM IR, resume, the SJLJ alternative, and the meaning of zero-cost.',
  },
  {
    id: 'cpython-exception-handling',
    authors: ['The CPython developers'],
    title: 'Description of exception handling (CPython InternalDocs/exception_handling.md)',
    venue: 'python/cpython, InternalDocs/exception_handling.md',
    year: null,
    doi: null,
    url: 'https://github.com/python/cpython/blob/main/InternalDocs/exception_handling.md',
    accessed: '2026-11-02',
    checkedAgainst: 'Read raw from github.com/python/cpython (main, commit 86be79a24830) on 2026-11-02: “Python uses a technique known as ‘zero-cost’ exception handling, which minimizes the cost of supporting exceptions. In the common case (where no exception is raised) the cost is reduced to zero (or close to zero). The cost of raising an exception is increased, but not by much.” SETUP_FINALLY and POP_BLOCK “are pseudo-instructions”; “The idea of zero-cost exception handling is to replace these pseudo-instructions by metadata which is stored alongside the bytecode … This metadata is the exception table, and it is stored in the code object’s co_exceptiontable field.” The table is “a sequence of 5-tuples: start-offset (inclusive), end-offset (exclusive), target, stack-depth, push-lasti”. python3.13 -m dis printed “ExceptionTable: L1 to L2 -> L3 [0]” for the chapter’s safe function.',
    shaped: 'Chapter 278: CPython’s exception table as an example of zero-cost exceptions in a bytecode VM.',
  },
  {
    id: 'v8-handler-table',
    authors: ['The V8 project authors'],
    title: 'handler-table.h (V8 source)',
    venue: 'v8/v8, src/codegen/handler-table.h',
    year: null,
    doi: null,
    url: 'https://github.com/v8/v8/blob/main/src/codegen/handler-table.h',
    accessed: '2026-11-02',
    checkedAgainst: 'Read raw from github.com/v8/v8 (main, commit fbf9d25cbb03) on 2026-11-02: “HandlerTable is a byte array containing entries for exception handlers in the code object it is associated with. The tables come in two flavors: 1) Based on ranges: Used for unoptimized code … Contains one entry per exception handler and a range representing the try-block covered by that handler … [ range-start , range-end , handler-offset , handler-data ] 2) Based on return addresses: Used for turbofanned code … one entry per call-site that could throw an exception.” node 22.23.4 --print-bytecode printed “Handler Table (size = 16) … ( 3, 11) -> 11 (prediction=1, data=0)” for the chapter’s safe function.',
    shaped: 'Chapter 278: V8’s bytecode handler table as a JavaScript example of table-driven exceptions.',
  },
  {
    id: 'openjdk-exceptioncatch',
    authors: ['Oracle and the OpenJDK contributors'],
    title: 'ExceptionCatch.java (java.lang.classfile.instruction, OpenJDK source)',
    venue: 'openjdk/jdk, src/java.base/share/classes/java/lang/classfile/instruction/ExceptionCatch.java',
    year: null,
    doi: null,
    url: 'https://github.com/openjdk/jdk/blob/master/src/java.base/share/classes/java/lang/classfile/instruction/ExceptionCatch.java',
    accessed: '2026-11-02',
    checkedAgainst: 'Read raw from github.com/openjdk/jdk (master, commit 774c5d1afcd3) on 2026-11-02: “A pseudo-instruction modeling an entry in the exception_table array of a Code attribute. Catch (JVMS 3.12) and finally (JVMS 3.14) blocks in Java source code compile to exception table entries. The order of exception table entries is significant: when an exception is thrown in a method, execution branches to the first matching exception handler if such a handler exists (JVMS 2.10).” Each entry has a handler, tryStart, tryEnd and an optional catchType. javap -c (JDK 21.0.12) printed “Exception table: from to target type / 0 4 5 Class java/lang/NumberFormatException” for the chapter’s safe method. (docs.oracle.com, which hosts the JVM specification, could not be reached from the session.)',
    shaped: 'Chapter 278: the JVM exception table, its ranges and handler targets, and first-match order.',
  },
];
