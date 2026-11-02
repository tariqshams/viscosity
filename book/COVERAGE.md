# Coverage: the standard texts, chapter by chapter

Generated from `src/data/coverage.js` by `scripts/coverage.mjs`; do not edit by hand.

The aim is that a reader of this book never needs another compiler
textbook. Each row is one chapter of a standard text, and the chapters of
this book that teach what it covers. `scripts/check_chapters.mjs` fails if
a row names a concept no chapter introduces.

## Aho, Lam, Sethi and Ullman, Compilers: Principles, Techniques, and Tools (2nd ed., 2006)

| Chapter | Title | Taught in |
|---|---|---|
| 1 | Introduction | 54. A map of the territory |
| 2 | A Simple Syntax-Directed Translator | 57. Writing a scanner; 62. Grammars; 63. Derivations, parse trees and ambiguity; 83. Syntax-directed translation and attribute grammars; 123. Three-address code |
| 3 | Lexical Analysis | 56. Tokens and lexemes; 59. Regular expressions as a language; 60. Finite automata; 61. From regular expressions to fast scanners |
| 4 | Syntax Analysis | 63. Derivations, parse trees and ambiguity; 67. Syntax errors and recovery; 68. FIRST, FOLLOW and LL(1); 69. Bottom-up parsing: shift and reduce; 70. LR(0) items and the LR automaton; 71. SLR, LALR and LR(1); 72. Parser generators, PEG, GLR and incremental parsing |
| 5 | Syntax-Directed Translation | 83. Syntax-directed translation and attribute grammars |
| 6 | Intermediate-Code Generation | 88. A type checker for typed Drip; 104. Jumps: if, while and for; 123. Three-address code; 150. Code shape: lowering control flow and data |
| 7 | Run-Time Environments | 46. Memory is one long array; 105. Calls and call frames; 107. Garbage collection: mark and sweep; 109. Making the VM fast; 149. Calling conventions and the ABI; 210. Reference counting; 215. Copying collection; 217. Incremental and concurrent collection |
| 8 | Code Generation | 124. Basic blocks and control-flow graphs; 151. Instruction selection by tree tiling; 154. Register allocation by graph colouring; 158. Peephole optimisation |
| 9 | Machine-Independent Optimizations | 125. Dominators; 128. Dataflow analysis; 129. The classic dataflow problems; 130. Lattices and abstract interpretation; 131. Constant folding and propagation; 132. Dead code elimination; 134. Partial redundancy elimination; 136. Loops |
| 10 | Instruction-Level Parallelism | 156. Instruction scheduling; 157. Software pipelining |
| 11 | Optimizing for Parallelism and Locality | 138. Loop transformations and vectorisation; 139. Locality, tiling and the polyhedral model |
| 12 | Interprocedural Analysis | 135. Inlining; 140. Alias analysis; 141. Interprocedural analysis |

## Cooper and Torczon, Engineering a Compiler (2nd ed., 2011)

| Chapter | Title | Taught in |
|---|---|---|
| 1 | Overview of Compilation | 54. A map of the territory; 122. What an IR is for |
| 2 | Scanners | 57. Writing a scanner; 59. Regular expressions as a language; 60. Finite automata; 61. From regular expressions to fast scanners |
| 3 | Parsers | 62. Grammars; 63. Derivations, parse trees and ambiguity; 65. Recursive descent parsing; 68. FIRST, FOLLOW and LL(1); 70. LR(0) items and the LR automaton; 71. SLR, LALR and LR(1) |
| 4 | Context-Sensitive Analysis | 83. Syntax-directed translation and attribute grammars; 86. What a type system promises; 88. A type checker for typed Drip; 143. Type and shape inference |
| 5 | Intermediate Representations | 64. Syntax trees; 122. What an IR is for; 123. Three-address code; 124. Basic blocks and control-flow graphs; 126. SSA form; 144. Sea of nodes and other IR designs |
| 6 | The Procedure Abstraction | 105. Calls and call frames; 149. Calling conventions and the ABI; 198. Closure conversion and lambda lifting; 207. Modules and separate compilation |
| 7 | Code Shape | 76. Control flow; 150. Code shape: lowering control flow and data; 195. Objects, vtables and dynamic dispatch |
| 8 | Introduction to Optimization | 133. Value numbering and common subexpressions; 135. Inlining; 137. Loop-invariant code motion and strength reduction; 145. Pass managers |
| 9 | Data-Flow Analysis | 125. Dominators; 127. Building SSA; 128. Dataflow analysis; 132. Dead code elimination; 141. Interprocedural analysis |
| 10 | Scalar Optimizations | 131. Constant folding and propagation; 132. Dead code elimination; 133. Value numbering and common subexpressions; 134. Partial redundancy elimination; 137. Loop-invariant code motion and strength reduction |
| 11 | Instruction Selection | 151. Instruction selection by tree tiling; 158. Peephole optimisation |
| 12 | Instruction Scheduling | 156. Instruction scheduling; 157. Software pipelining |
| 13 | Register Allocation | 153. Live ranges and interference; 154. Register allocation by graph colouring; 155. Spilling and linear scan |

## Appel, Modern Compiler Implementation in ML (1998)

| Chapter | Title | Taught in |
|---|---|---|
| 1 | Introduction | 54. A map of the territory |
| 2 | Lexical Analysis | 59. Regular expressions as a language; 60. Finite automata; 61. From regular expressions to fast scanners |
| 3 | Parsing | 67. Syntax errors and recovery; 68. FIRST, FOLLOW and LL(1); 70. LR(0) items and the LR automaton; 71. SLR, LALR and LR(1); 72. Parser generators, PEG, GLR and incremental parsing |
| 4 | Abstract Syntax | 64. Syntax trees; 83. Syntax-directed translation and attribute grammars |
| 5 | Semantic Analysis | 80. Resolving variables; 87. Reading typing rules; 88. A type checker for typed Drip |
| 6 | Activation Records | 105. Calls and call frames; 149. Calling conventions and the ABI; 198. Closure conversion and lambda lifting |
| 7 | Translation to Intermediate Code | 123. Three-address code; 150. Code shape: lowering control flow and data; 167. Lowering JavaScript to VIR |
| 8 | Basic Blocks and Traces | 124. Basic blocks and control-flow graphs |
| 9 | Instruction Selection | 151. Instruction selection by tree tiling |
| 10 | Liveness Analysis | 132. Dead code elimination; 153. Live ranges and interference |
| 11 | Register Allocation | 154. Register allocation by graph colouring; 155. Spilling and linear scan |
| 12 | Putting It All Together | 161. Drip to RISC-V, end to end |
| 13 | Garbage Collection | 107. Garbage collection: mark and sweep; 109. Making the VM fast; 210. Reference counting; 215. Copying collection; 217. Incremental and concurrent collection |
| 14 | Object-Oriented Languages | 195. Objects, vtables and dynamic dispatch |
| 15 | Functional Programming Languages | 198. Closure conversion and lambda lifting; 205. Tail calls; 212. Lazy evaluation |
| 16 | Polymorphic Types | 89. Unification; 90. Hindley–Milner type inference; 197. Generics: specialisation or erasure |
| 17 | Dataflow Analysis | 129. The classic dataflow problems; 132. Dead code elimination; 140. Alias analysis |
| 18 | Loop Optimizations | 136. Loops; 137. Loop-invariant code motion and strength reduction; 138. Loop transformations and vectorisation |
| 19 | Static Single-Assignment Form | 125. Dominators; 126. SSA form; 127. Building SSA; 152. Leaving SSA |
| 20 | Pipelining and Scheduling | 156. Instruction scheduling; 157. Software pipelining |
| 21 | The Memory Hierarchy | 47. The CPU and its caches; 48. Cache lines and locality; 49. Prefetching and branch prediction; 139. Locality, tiling and the polyhedral model |

## Nystrom, Crafting Interpreters (2021)

| Chapter | Title | Taught in |
|---|---|---|
| I | Welcome | 54. A map of the territory; 55. Meet Drip |
| II | A Tree-Walk Interpreter | 12. Closures: functions that remember; 57. Writing a scanner; 62. Grammars; 65. Recursive descent parsing; 73. Evaluating expressions; 75. Environments and scope; 80. Resolving variables; 81. Classes and instances in Drip; 82. Inheritance, and measuring the tree-walker |
| III | A Bytecode Virtual Machine | 66. Pratt parsing; 94. Why bytecode?; 96. A stack-based VM; 100. Hash tables; 101. String interning; 106. Closures and upvalues; 107. Garbage collection: mark and sweep; 108. Classes and methods in the VM; 109. Making the VM fast |

## Pierce, Types and Programming Languages (2002)

| Chapter | Title | Taught in |
|---|---|---|
| 1–4 | Introduction, mathematical preliminaries, untyped arithmetic | 85. Operational semantics; 86. What a type system promises; 87. Reading typing rules |
| 5–7 | The untyped lambda calculus | 84. The lambda calculus |
| 8–11 | Typed arithmetic, simple types, extensions | 85. Operational semantics; 87. Reading typing rules; 88. A type checker for typed Drip |
| 12 | Normalization | 92. Bidirectional checking and soundness |
| 13–14 | References and exceptions | 86. What a type system promises; 92. Bidirectional checking and soundness |
| 15–19 | Subtyping, metatheory, imperative objects, Featherweight Java | 91. Subtyping and variance |
| 20–21 | Recursive types | 89. Unification; 201. Sum types in memory |
| 22 | Type reconstruction | 89. Unification; 90. Hindley–Milner type inference |
| 23–28 | Universal and existential types, bounded quantification | 34. TypeScript III: generics in depth; 93. Beyond: System F, dependent and linear types |
| 29–32 | Type operators and higher-order systems | 35. TypeScript IV: computing with types; 36. TypeScript V: conditional, template and utility types; 93. Beyond: System F, dependent and linear types |

## Jones, Hosking and Moss, The Garbage Collection Handbook (2012)

| Chapter | Title | Taught in |
|---|---|---|
| 2 | Mark-sweep garbage collection | 107. Garbage collection: mark and sweep |
| 3 | Mark-compact garbage collection | 117. V8’s garbage collector; 218. Allocation, compaction and real collectors |
| 4 | Copying garbage collection | 215. Copying collection |
| 5 | Reference counting | 210. Reference counting |
| 6 | Comparing garbage collectors | 218. Allocation, compaction and real collectors |
| 7 | Allocation | 218. Allocation, compaction and real collectors |
| 8 | Partitioning the heap | 109. Making the VM fast; 216. Generational collection in depth |
| 9 | Generational garbage collection | 109. Making the VM fast; 117. V8’s garbage collector; 216. Generational collection in depth |
| 10 | Other partitioned schemes | 218. Allocation, compaction and real collectors |
| 11 | Run-time interface | 107. Garbage collection: mark and sweep; 117. V8’s garbage collector; 217. Incremental and concurrent collection |
| 12 | Language-specific concerns | 218. Allocation, compaction and real collectors |
| 13 | Concurrency preliminaries | 214. Threads, memory models and atomics |
| 14–16 | Parallel, concurrent and on-the-fly collection | 217. Incremental and concurrent collection |

## Rastello and Bouchez Tichadou (eds.), SSA-based Compiler Design (2022)

| Chapter | Title | Taught in |
|---|---|---|
| I | Vanilla SSA: introduction, construction, destruction | 125. Dominators; 126. SSA form; 127. Building SSA; 152. Leaving SSA |
| II | Analysis | 131. Constant folding and propagation; 132. Dead code elimination; 133. Value numbering and common subexpressions; 285. A generic dataflow framework |
| III | Extensions | 144. Sea of nodes and other IR designs |
| IV | Machine code generation and optimisation | 151. Instruction selection by tree tiling; 154. Register allocation by graph colouring |

## Muchnick, Advanced Compiler Design and Implementation (1997)

| Chapter | Title | Taught in |
|---|---|---|
| 1–4 | Introduction, informal notation, symbol tables, IRs | 80. Resolving variables; 122. What an IR is for; 123. Three-address code |
| 5 | Run-Time Support | 105. Calls and call frames; 149. Calling conventions and the ABI |
| 6 | Producing Code Generators Automatically | 151. Instruction selection by tree tiling |
| 7–8 | Control-Flow and Data-Flow Analysis | 124. Basic blocks and control-flow graphs; 125. Dominators; 128. Dataflow analysis; 130. Lattices and abstract interpretation |
| 9 | Dependence Analysis and Dependence Graphs | 138. Loop transformations and vectorisation; 156. Instruction scheduling |
| 10 | Alias Analysis | 140. Alias analysis |
| 11–13 | Introduction to Optimization; Early Optimizations; Redundancy Elimination | 131. Constant folding and propagation; 133. Value numbering and common subexpressions; 134. Partial redundancy elimination; 137. Loop-invariant code motion and strength reduction |
| 14 | Loop Optimizations | 137. Loop-invariant code motion and strength reduction; 138. Loop transformations and vectorisation |
| 15 | Procedure Optimizations | 135. Inlining; 205. Tail calls |
| 16 | Register Allocation | 154. Register allocation by graph colouring; 155. Spilling and linear scan |
| 17 | Code Scheduling | 156. Instruction scheduling; 157. Software pipelining |
| 18 | Control-Flow and Low-Level Optimizations | 132. Dead code elimination; 158. Peephole optimisation |
| 19 | Interprocedural Analysis and Optimization | 141. Interprocedural analysis |
| 20 | Optimization for the Memory Hierarchy | 48. Cache lines and locality; 49. Prefetching and branch prediction; 139. Locality, tiling and the polyhedral model |
| 21 | Case Studies of Compilers and Future Trends | 162. Real back ends: LLVM, clang and rustc |
