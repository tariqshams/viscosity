# Coverage: the standard texts, chapter by chapter

Generated from `src/data/coverage.js` by `scripts/coverage.mjs`; do not edit by hand.

The aim is that a reader of this book never needs another compiler
textbook. Each row is one chapter of a standard text, and the chapters of
this book that teach what it covers. `scripts/check_chapters.mjs` fails if
a row names a concept no chapter introduces.

## Aho, Lam, Sethi and Ullman, Compilers: Principles, Techniques, and Tools (2nd ed., 2006)

| Chapter | Title | Taught in |
|---|---|---|
| 1 | Introduction | 62. A map of the territory |
| 2 | A Simple Syntax-Directed Translator | 65. Writing a scanner; 70. Grammars; 71. Derivations, parse trees and ambiguity; 91. Syntax-directed translation and attribute grammars; 131. Three-address code |
| 3 | Lexical Analysis | 64. Tokens and lexemes; 67. Regular expressions as a language; 68. Finite automata; 69. From regular expressions to fast scanners |
| 4 | Syntax Analysis | 71. Derivations, parse trees and ambiguity; 75. Syntax errors and recovery; 76. FIRST, FOLLOW and LL(1); 77. Bottom-up parsing: shift and reduce; 78. LR(0) items and the LR automaton; 79. SLR, LALR and LR(1); 80. Parser generators, PEG, GLR and incremental parsing |
| 5 | Syntax-Directed Translation | 91. Syntax-directed translation and attribute grammars |
| 6 | Intermediate-Code Generation | 96. A type checker for typed Drip; 112. Jumps: if, while and for; 131. Three-address code; 158. Code shape: lowering control flow and data |
| 7 | Run-Time Environments | 48. Pointers, the stack and the heap; 113. Calls and call frames; 115. Garbage collection: mark and sweep; 117. Making the VM fast; 157. Calling conventions and the ABI; 218. Reference counting; 223. Copying collection; 225. Incremental and concurrent collection |
| 8 | Code Generation | 132. Basic blocks and control-flow graphs; 159. Instruction selection by tree tiling; 162. Register allocation by graph colouring; 166. Peephole optimisation |
| 9 | Machine-Independent Optimizations | 133. Dominators; 136. Dataflow analysis; 137. The classic dataflow problems; 138. Lattices and abstract interpretation; 139. Constant folding and propagation; 140. Dead code elimination; 142. Partial redundancy elimination; 144. Loops |
| 10 | Instruction-Level Parallelism | 164. Instruction scheduling; 165. Software pipelining |
| 11 | Optimizing for Parallelism and Locality | 146. Loop transformations and vectorisation; 147. Locality, tiling and the polyhedral model |
| 12 | Interprocedural Analysis | 143. Inlining; 148. Alias analysis; 149. Interprocedural analysis |

## Cooper and Torczon, Engineering a Compiler (2nd ed., 2011)

| Chapter | Title | Taught in |
|---|---|---|
| 1 | Overview of Compilation | 62. A map of the territory; 130. What an IR is for |
| 2 | Scanners | 65. Writing a scanner; 67. Regular expressions as a language; 68. Finite automata; 69. From regular expressions to fast scanners |
| 3 | Parsers | 70. Grammars; 71. Derivations, parse trees and ambiguity; 73. Recursive descent parsing; 76. FIRST, FOLLOW and LL(1); 78. LR(0) items and the LR automaton; 79. SLR, LALR and LR(1) |
| 4 | Context-Sensitive Analysis | 91. Syntax-directed translation and attribute grammars; 94. What a type system promises; 96. A type checker for typed Drip; 151. Type and shape inference |
| 5 | Intermediate Representations | 72. Syntax trees; 130. What an IR is for; 131. Three-address code; 132. Basic blocks and control-flow graphs; 134. SSA form; 152. Sea of nodes and other IR designs |
| 6 | The Procedure Abstraction | 113. Calls and call frames; 157. Calling conventions and the ABI; 206. Closure conversion and lambda lifting; 215. Modules and separate compilation |
| 7 | Code Shape | 84. Control flow; 158. Code shape: lowering control flow and data; 203. Objects, vtables and dynamic dispatch |
| 8 | Introduction to Optimization | 141. Value numbering and common subexpressions; 143. Inlining; 145. Loop-invariant code motion and strength reduction; 153. Pass managers |
| 9 | Data-Flow Analysis | 133. Dominators; 135. Building SSA; 136. Dataflow analysis; 140. Dead code elimination; 149. Interprocedural analysis |
| 10 | Scalar Optimizations | 139. Constant folding and propagation; 140. Dead code elimination; 141. Value numbering and common subexpressions; 142. Partial redundancy elimination; 145. Loop-invariant code motion and strength reduction |
| 11 | Instruction Selection | 159. Instruction selection by tree tiling; 166. Peephole optimisation |
| 12 | Instruction Scheduling | 164. Instruction scheduling; 165. Software pipelining |
| 13 | Register Allocation | 161. Live ranges and interference; 162. Register allocation by graph colouring; 163. Spilling and linear scan |

## Appel, Modern Compiler Implementation in ML (1998)

| Chapter | Title | Taught in |
|---|---|---|
| 1 | Introduction | 62. A map of the territory |
| 2 | Lexical Analysis | 67. Regular expressions as a language; 68. Finite automata; 69. From regular expressions to fast scanners |
| 3 | Parsing | 75. Syntax errors and recovery; 76. FIRST, FOLLOW and LL(1); 78. LR(0) items and the LR automaton; 79. SLR, LALR and LR(1); 80. Parser generators, PEG, GLR and incremental parsing |
| 4 | Abstract Syntax | 72. Syntax trees; 91. Syntax-directed translation and attribute grammars |
| 5 | Semantic Analysis | 88. Resolving variables; 95. Reading typing rules; 96. A type checker for typed Drip |
| 6 | Activation Records | 113. Calls and call frames; 157. Calling conventions and the ABI; 206. Closure conversion and lambda lifting |
| 7 | Translation to Intermediate Code | 131. Three-address code; 158. Code shape: lowering control flow and data; 175. Lowering JavaScript to VIR |
| 8 | Basic Blocks and Traces | 132. Basic blocks and control-flow graphs |
| 9 | Instruction Selection | 159. Instruction selection by tree tiling |
| 10 | Liveness Analysis | 140. Dead code elimination; 161. Live ranges and interference |
| 11 | Register Allocation | 162. Register allocation by graph colouring; 163. Spilling and linear scan |
| 12 | Putting It All Together | 169. Drip to RISC-V, end to end |
| 13 | Garbage Collection | 115. Garbage collection: mark and sweep; 117. Making the VM fast; 218. Reference counting; 223. Copying collection; 225. Incremental and concurrent collection |
| 14 | Object-Oriented Languages | 203. Objects, vtables and dynamic dispatch |
| 15 | Functional Programming Languages | 206. Closure conversion and lambda lifting; 213. Tail calls; 220. Lazy evaluation |
| 16 | Polymorphic Types | 97. Unification; 98. Hindley–Milner type inference; 205. Generics: specialisation or erasure |
| 17 | Dataflow Analysis | 137. The classic dataflow problems; 140. Dead code elimination; 148. Alias analysis |
| 18 | Loop Optimizations | 144. Loops; 145. Loop-invariant code motion and strength reduction; 146. Loop transformations and vectorisation |
| 19 | Static Single-Assignment Form | 133. Dominators; 134. SSA form; 135. Building SSA; 160. Leaving SSA |
| 20 | Pipelining and Scheduling | 164. Instruction scheduling; 165. Software pipelining |
| 21 | The Memory Hierarchy | 49. The CPU and its caches; 51. Cache lines and locality; 53. Prefetching and pointer chasing; 147. Locality, tiling and the polyhedral model |

## Pierce, Types and Programming Languages (2002)

| Chapter | Title | Taught in |
|---|---|---|
| 1–4 | Introduction, mathematical preliminaries, untyped arithmetic | 93. Operational semantics; 94. What a type system promises; 95. Reading typing rules |
| 5–7 | The untyped lambda calculus | 92. The lambda calculus |
| 8–11 | Typed arithmetic, simple types, extensions | 93. Operational semantics; 95. Reading typing rules; 96. A type checker for typed Drip |
| 12 | Normalization | 100. Bidirectional checking and soundness |
| 13–14 | References and exceptions | 94. What a type system promises; 100. Bidirectional checking and soundness |
| 15–19 | Subtyping, metatheory, imperative objects, Featherweight Java | 99. Subtyping and variance |
| 20–21 | Recursive types | 97. Unification; 209. Sum types in memory |
| 22 | Type reconstruction | 97. Unification; 98. Hindley–Milner type inference |
| 23–28 | Universal and existential types, bounded quantification | 35. TypeScript III: generics in depth; 101. Beyond: System F, dependent and linear types |
| 29–32 | Type operators and higher-order systems | 36. TypeScript IV: computing with types; 37. TypeScript V: conditional, template and utility types; 101. Beyond: System F, dependent and linear types |

## Jones, Hosking and Moss, The Garbage Collection Handbook (2012)

| Chapter | Title | Taught in |
|---|---|---|
| 2 | Mark-sweep garbage collection | 115. Garbage collection: mark and sweep |
| 3 | Mark-compact garbage collection | 125. V8’s garbage collector; 226. Allocation, compaction and real collectors |
| 4 | Copying garbage collection | 223. Copying collection |
| 5 | Reference counting | 218. Reference counting |
| 6 | Comparing garbage collectors | 226. Allocation, compaction and real collectors |
| 7 | Allocation | 226. Allocation, compaction and real collectors |
| 8 | Partitioning the heap | 117. Making the VM fast; 224. Generational collection in depth |
| 9 | Generational garbage collection | 117. Making the VM fast; 125. V8’s garbage collector; 224. Generational collection in depth |
| 10 | Other partitioned schemes | 226. Allocation, compaction and real collectors |
| 11 | Run-time interface | 115. Garbage collection: mark and sweep; 125. V8’s garbage collector; 225. Incremental and concurrent collection |
| 12 | Language-specific concerns | 226. Allocation, compaction and real collectors |
| 13 | Concurrency preliminaries | 222. Threads, memory models and atomics |
| 14–16 | Parallel, concurrent and on-the-fly collection | 225. Incremental and concurrent collection |

## Rastello and Bouchez Tichadou (eds.), SSA-based Compiler Design (2022)

| Chapter | Title | Taught in |
|---|---|---|
| I | Vanilla SSA: introduction, construction, destruction | 133. Dominators; 134. SSA form; 135. Building SSA; 160. Leaving SSA |
| II | Analysis | 139. Constant folding and propagation; 140. Dead code elimination; 141. Value numbering and common subexpressions; 293. A generic dataflow framework |
| III | Extensions | 152. Sea of nodes and other IR designs |
| IV | Machine code generation and optimisation | 159. Instruction selection by tree tiling; 162. Register allocation by graph colouring |

## Muchnick, Advanced Compiler Design and Implementation (1997)

| Chapter | Title | Taught in |
|---|---|---|
| 1–4 | Introduction, informal notation, symbol tables, IRs | 88. Resolving variables; 130. What an IR is for; 131. Three-address code |
| 5 | Run-Time Support | 113. Calls and call frames; 157. Calling conventions and the ABI |
| 6 | Producing Code Generators Automatically | 159. Instruction selection by tree tiling |
| 7–8 | Control-Flow and Data-Flow Analysis | 132. Basic blocks and control-flow graphs; 133. Dominators; 136. Dataflow analysis; 138. Lattices and abstract interpretation |
| 9 | Dependence Analysis and Dependence Graphs | 146. Loop transformations and vectorisation; 164. Instruction scheduling |
| 10 | Alias Analysis | 148. Alias analysis |
| 11–13 | Introduction to Optimization; Early Optimizations; Redundancy Elimination | 139. Constant folding and propagation; 141. Value numbering and common subexpressions; 142. Partial redundancy elimination; 145. Loop-invariant code motion and strength reduction |
| 14 | Loop Optimizations | 145. Loop-invariant code motion and strength reduction; 146. Loop transformations and vectorisation |
| 15 | Procedure Optimizations | 143. Inlining; 213. Tail calls |
| 16 | Register Allocation | 162. Register allocation by graph colouring; 163. Spilling and linear scan |
| 17 | Code Scheduling | 164. Instruction scheduling; 165. Software pipelining |
| 18 | Control-Flow and Low-Level Optimizations | 140. Dead code elimination; 166. Peephole optimisation |
| 19 | Interprocedural Analysis and Optimization | 149. Interprocedural analysis |
| 20 | Optimization for the Memory Hierarchy | 51. Cache lines and locality; 53. Prefetching and pointer chasing; 147. Locality, tiling and the polyhedral model |
| 21 | Case Studies of Compilers and Future Trends | 170. Real back ends: LLVM, clang and rustc |
