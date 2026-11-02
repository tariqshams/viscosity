# Coverage: the standard texts, chapter by chapter

Generated from `src/data/coverage.js` by `scripts/coverage.mjs`; do not edit by hand.

The aim is that a reader of this book never needs another compiler
textbook. Each row is one chapter of a standard text, and the chapters of
this book that teach what it covers. `scripts/check_chapters.mjs` fails if
a row names a concept no chapter introduces.

## Aho, Lam, Sethi and Ullman, Compilers: Principles, Techniques, and Tools (2nd ed., 2006)

| Chapter | Title | Taught in |
|---|---|---|
| 1 | Introduction | 32. A map of the territory |
| 2 | A Simple Syntax-Directed Translator | 35. Writing a scanner; 40. Grammars; 41. Derivations, parse trees and ambiguity; 61. Syntax-directed translation and attribute grammars; 101. Three-address code |
| 3 | Lexical Analysis | 34. Tokens and lexemes; 37. Regular expressions as a language; 38. Finite automata; 39. From regular expressions to fast scanners |
| 4 | Syntax Analysis | 41. Derivations, parse trees and ambiguity; 45. Syntax errors and recovery; 46. FIRST, FOLLOW and LL(1); 47. Bottom-up parsing: shift and reduce; 48. LR(0) items and the LR automaton; 49. SLR, LALR and LR(1); 50. Parser generators, PEG, GLR and incremental parsing |
| 5 | Syntax-Directed Translation | 61. Syntax-directed translation and attribute grammars |
| 6 | Intermediate-Code Generation | 66. A type checker for typed Drip; 82. Jumps: if, while and for; 101. Three-address code; 128. Code shape: lowering control flow and data |
| 7 | Run-Time Environments | 24. Memory is one long array; 83. Calls and call frames; 85. Garbage collection: mark and sweep; 87. Making the VM fast; 127. Calling conventions and the ABI; 188. Reference counting; 193. Copying collection; 195. Incremental and concurrent collection |
| 8 | Code Generation | 102. Basic blocks and control-flow graphs; 129. Instruction selection by tree tiling; 132. Register allocation by graph colouring; 136. Peephole optimisation |
| 9 | Machine-Independent Optimizations | 103. Dominators; 106. Dataflow analysis; 107. The classic dataflow problems; 108. Lattices and abstract interpretation; 109. Constant folding and propagation; 110. Dead code elimination; 112. Partial redundancy elimination; 114. Loops |
| 10 | Instruction-Level Parallelism | 134. Instruction scheduling; 135. Software pipelining |
| 11 | Optimizing for Parallelism and Locality | 116. Loop transformations and vectorisation; 117. Locality, tiling and the polyhedral model |
| 12 | Interprocedural Analysis | 113. Inlining; 118. Alias analysis; 119. Interprocedural analysis |

## Cooper and Torczon, Engineering a Compiler (2nd ed., 2011)

| Chapter | Title | Taught in |
|---|---|---|
| 1 | Overview of Compilation | 32. A map of the territory; 100. What an IR is for |
| 2 | Scanners | 35. Writing a scanner; 37. Regular expressions as a language; 38. Finite automata; 39. From regular expressions to fast scanners |
| 3 | Parsers | 40. Grammars; 41. Derivations, parse trees and ambiguity; 43. Recursive descent parsing; 46. FIRST, FOLLOW and LL(1); 48. LR(0) items and the LR automaton; 49. SLR, LALR and LR(1) |
| 4 | Context-Sensitive Analysis | 61. Syntax-directed translation and attribute grammars; 64. What a type system promises; 66. A type checker for typed Drip; 121. Type and shape inference |
| 5 | Intermediate Representations | 42. Syntax trees; 100. What an IR is for; 101. Three-address code; 102. Basic blocks and control-flow graphs; 104. SSA form; 122. Sea of nodes and other IR designs |
| 6 | The Procedure Abstraction | 83. Calls and call frames; 127. Calling conventions and the ABI; 176. Closure conversion and lambda lifting; 185. Modules and separate compilation |
| 7 | Code Shape | 54. Control flow; 128. Code shape: lowering control flow and data; 173. Objects, vtables and dynamic dispatch |
| 8 | Introduction to Optimization | 111. Value numbering and common subexpressions; 113. Inlining; 115. Loop-invariant code motion and strength reduction; 123. Pass managers |
| 9 | Data-Flow Analysis | 103. Dominators; 105. Building SSA; 106. Dataflow analysis; 110. Dead code elimination; 119. Interprocedural analysis |
| 10 | Scalar Optimizations | 109. Constant folding and propagation; 110. Dead code elimination; 111. Value numbering and common subexpressions; 112. Partial redundancy elimination; 115. Loop-invariant code motion and strength reduction |
| 11 | Instruction Selection | 129. Instruction selection by tree tiling; 136. Peephole optimisation |
| 12 | Instruction Scheduling | 134. Instruction scheduling; 135. Software pipelining |
| 13 | Register Allocation | 131. Live ranges and interference; 132. Register allocation by graph colouring; 133. Spilling and linear scan |

## Appel, Modern Compiler Implementation in ML (1998)

| Chapter | Title | Taught in |
|---|---|---|
| 1 | Introduction | 32. A map of the territory |
| 2 | Lexical Analysis | 37. Regular expressions as a language; 38. Finite automata; 39. From regular expressions to fast scanners |
| 3 | Parsing | 45. Syntax errors and recovery; 46. FIRST, FOLLOW and LL(1); 48. LR(0) items and the LR automaton; 49. SLR, LALR and LR(1); 50. Parser generators, PEG, GLR and incremental parsing |
| 4 | Abstract Syntax | 42. Syntax trees; 61. Syntax-directed translation and attribute grammars |
| 5 | Semantic Analysis | 58. Resolving variables; 65. Reading typing rules; 66. A type checker for typed Drip |
| 6 | Activation Records | 83. Calls and call frames; 127. Calling conventions and the ABI; 176. Closure conversion and lambda lifting |
| 7 | Translation to Intermediate Code | 101. Three-address code; 128. Code shape: lowering control flow and data; 145. Lowering JavaScript to VIR |
| 8 | Basic Blocks and Traces | 102. Basic blocks and control-flow graphs |
| 9 | Instruction Selection | 129. Instruction selection by tree tiling |
| 10 | Liveness Analysis | 110. Dead code elimination; 131. Live ranges and interference |
| 11 | Register Allocation | 132. Register allocation by graph colouring; 133. Spilling and linear scan |
| 12 | Putting It All Together | 139. Drip to RISC-V, end to end |
| 13 | Garbage Collection | 85. Garbage collection: mark and sweep; 87. Making the VM fast; 188. Reference counting; 193. Copying collection; 195. Incremental and concurrent collection |
| 14 | Object-Oriented Languages | 173. Objects, vtables and dynamic dispatch |
| 15 | Functional Programming Languages | 176. Closure conversion and lambda lifting; 183. Tail calls; 190. Lazy evaluation |
| 16 | Polymorphic Types | 67. Unification; 68. Hindley–Milner type inference; 175. Generics: specialisation or erasure |
| 17 | Dataflow Analysis | 107. The classic dataflow problems; 110. Dead code elimination; 118. Alias analysis |
| 18 | Loop Optimizations | 114. Loops; 115. Loop-invariant code motion and strength reduction; 116. Loop transformations and vectorisation |
| 19 | Static Single-Assignment Form | 103. Dominators; 104. SSA form; 105. Building SSA; 130. Leaving SSA |
| 20 | Pipelining and Scheduling | 134. Instruction scheduling; 135. Software pipelining |
| 21 | The Memory Hierarchy | 25. The CPU and its caches; 26. Cache lines and locality; 27. Prefetching and branch prediction; 117. Locality, tiling and the polyhedral model |

## Nystrom, Crafting Interpreters (2021)

| Chapter | Title | Taught in |
|---|---|---|
| I | Welcome | 32. A map of the territory; 33. Meet Drip |
| II | A Tree-Walk Interpreter | 6. Closures: functions that remember; 35. Writing a scanner; 40. Grammars; 43. Recursive descent parsing; 51. Evaluating expressions; 53. Environments and scope; 58. Resolving variables; 59. Classes and instances in Drip; 60. Inheritance, and measuring the tree-walker |
| III | A Bytecode Virtual Machine | 44. Pratt parsing; 72. Why bytecode?; 74. A stack-based VM; 78. Hash tables; 79. String interning; 84. Closures and upvalues; 85. Garbage collection: mark and sweep; 86. Classes and methods in the VM; 87. Making the VM fast |

## Pierce, Types and Programming Languages (2002)

| Chapter | Title | Taught in |
|---|---|---|
| 1–4 | Introduction, mathematical preliminaries, untyped arithmetic | 63. Operational semantics; 64. What a type system promises; 65. Reading typing rules |
| 5–7 | The untyped lambda calculus | 62. The lambda calculus |
| 8–11 | Typed arithmetic, simple types, extensions | 63. Operational semantics; 65. Reading typing rules; 66. A type checker for typed Drip |
| 12 | Normalization | 70. Bidirectional checking and soundness |
| 13–14 | References and exceptions | 64. What a type system promises; 70. Bidirectional checking and soundness |
| 15–19 | Subtyping, metatheory, imperative objects, Featherweight Java | 69. Subtyping and variance |
| 20–21 | Recursive types | 67. Unification; 179. Sum types in memory |
| 22 | Type reconstruction | 67. Unification; 68. Hindley–Milner type inference |
| 23–28 | Universal and existential types, bounded quantification | 17. TypeScript III: generics in depth; 71. Beyond: System F, dependent and linear types |
| 29–32 | Type operators and higher-order systems | 18. TypeScript IV: computing with types; 71. Beyond: System F, dependent and linear types |

## Jones, Hosking and Moss, The Garbage Collection Handbook (2012)

| Chapter | Title | Taught in |
|---|---|---|
| 2 | Mark-sweep garbage collection | 85. Garbage collection: mark and sweep |
| 3 | Mark-compact garbage collection | 95. V8’s garbage collector; 196. Allocation, compaction and real collectors |
| 4 | Copying garbage collection | 193. Copying collection |
| 5 | Reference counting | 188. Reference counting |
| 6 | Comparing garbage collectors | 196. Allocation, compaction and real collectors |
| 7 | Allocation | 196. Allocation, compaction and real collectors |
| 8 | Partitioning the heap | 87. Making the VM fast; 194. Generational collection in depth |
| 9 | Generational garbage collection | 87. Making the VM fast; 95. V8’s garbage collector; 194. Generational collection in depth |
| 10 | Other partitioned schemes | 196. Allocation, compaction and real collectors |
| 11 | Run-time interface | 85. Garbage collection: mark and sweep; 95. V8’s garbage collector; 195. Incremental and concurrent collection |
| 12 | Language-specific concerns | 196. Allocation, compaction and real collectors |
| 13 | Concurrency preliminaries | 192. Threads, memory models and atomics |
| 14–16 | Parallel, concurrent and on-the-fly collection | 195. Incremental and concurrent collection |

## Rastello and Bouchez Tichadou (eds.), SSA-based Compiler Design (2022)

| Chapter | Title | Taught in |
|---|---|---|
| I | Vanilla SSA: introduction, construction, destruction | 103. Dominators; 104. SSA form; 105. Building SSA; 130. Leaving SSA |
| II | Analysis | 109. Constant folding and propagation; 110. Dead code elimination; 111. Value numbering and common subexpressions; 263. A generic dataflow framework |
| III | Extensions | 122. Sea of nodes and other IR designs |
| IV | Machine code generation and optimisation | 129. Instruction selection by tree tiling; 132. Register allocation by graph colouring |

## Muchnick, Advanced Compiler Design and Implementation (1997)

| Chapter | Title | Taught in |
|---|---|---|
| 1–4 | Introduction, informal notation, symbol tables, IRs | 58. Resolving variables; 100. What an IR is for; 101. Three-address code |
| 5 | Run-Time Support | 83. Calls and call frames; 127. Calling conventions and the ABI |
| 6 | Producing Code Generators Automatically | 129. Instruction selection by tree tiling |
| 7–8 | Control-Flow and Data-Flow Analysis | 102. Basic blocks and control-flow graphs; 103. Dominators; 106. Dataflow analysis; 108. Lattices and abstract interpretation |
| 9 | Dependence Analysis and Dependence Graphs | 116. Loop transformations and vectorisation; 134. Instruction scheduling |
| 10 | Alias Analysis | 118. Alias analysis |
| 11–13 | Introduction to Optimization; Early Optimizations; Redundancy Elimination | 109. Constant folding and propagation; 111. Value numbering and common subexpressions; 112. Partial redundancy elimination; 115. Loop-invariant code motion and strength reduction |
| 14 | Loop Optimizations | 115. Loop-invariant code motion and strength reduction; 116. Loop transformations and vectorisation |
| 15 | Procedure Optimizations | 113. Inlining; 183. Tail calls |
| 16 | Register Allocation | 132. Register allocation by graph colouring; 133. Spilling and linear scan |
| 17 | Code Scheduling | 134. Instruction scheduling; 135. Software pipelining |
| 18 | Control-Flow and Low-Level Optimizations | 110. Dead code elimination; 136. Peephole optimisation |
| 19 | Interprocedural Analysis and Optimization | 119. Interprocedural analysis |
| 20 | Optimization for the Memory Hierarchy | 26. Cache lines and locality; 27. Prefetching and branch prediction; 117. Locality, tiling and the polyhedral model |
| 21 | Case Studies of Compilers and Future Trends | 140. Real back ends: LLVM, clang and rustc |
