export default {
  id: 'III', track: 'A', days: '16–30', title: 'Front ends: building Drip, and the theory behind it',
  blurb: 'Build Drip, a small language: grammars, scanning, recursive descent and Pratt parsing, evaluation, environments, closures, resolution, classes.',
  chapters: [
    { n: 63, title: 'From source text to a running program', introduces: {
      'compiler-pipeline': 'source → tokens → tree → (IR) → output',
      'front-end-back-end': 'the halves of a language implementation',
    } },
    { n: 64, title: 'Interpreters and compilers', introduces: {
      interpreter: 'a program that runs another program directly',
      compiler: 'a program that translates a program into another form',
    } },
    { n: 65, title: 'Meet Drip', introduces: {
      drip: 'the small language this book implements',
    } },
    { n: 66, title: 'Dynamic typing and the language spec', introduces: {
      'dynamic-typing': 'types are checked while the program runs',
      'language-spec': 'a precise description of what programs mean',
    } },
    { n: 67, title: 'Tokens and lexemes', introduces: { token: 'one meaningful word of source code', lexeme: 'the exact characters of a token', 'token-type': 'the category of a token: number, identifier, plus…', 'source-location': 'line and column of a token' } },
    { n: 68, title: 'Writing a scanner', introduces: {
      scanner: 'turns characters into tokens',
    } },
    { n: 69, title: 'Lookahead and maximal munch', introduces: {
      lookahead: 'peeking at the next character without consuming it',
      'maximal-munch': 'always take the longest token that fits',
    } },
    { n: 70, title: 'Numbers and strings', introduces: {
      literal: 'a value written directly in source',
    } },
    { n: 71, title: 'Names and keywords', introduces: {
      identifier: 'a name chosen by the programmer',
      keyword: 'a reserved word like if or while',
      'reserved-word-table': 'looking keywords up in a table',
    } },
    { n: 72, title: 'Regular expressions as a language', introduces: {
      'regular-expression': 'a pattern built from characters, choice, sequence and repetition',
      'regex-operators': 'concatenation, alternation (|) and Kleene star (*)',
      'regular-language': 'the set of strings a regular expression matches',
    } },
    { n: 73, title: 'Finite automata', introduces: {
      'finite-automaton': 'a machine with finitely many states that reads one character at a time',
      dfa: 'a deterministic finite automaton: one next state per character',
      'accepting-state': 'a state where the input so far is a match',
    } },
    { n: 74, title: 'Nondeterministic automata', introduces: {
      nfa: 'a nondeterministic finite automaton: several possible next states, and ε-moves',
    } },
    { n: 75, title: 'From regular expressions to fast scanners', introduces: {
      'thompson-construction': 'building an NFA from a regular expression, piece by piece',
      'subset-construction': 'turning an NFA into a DFA by tracking sets of states',
    } },
    { n: 76, title: 'Minimal DFAs and scanner generators', introduces: {
      'dfa-minimization': 'merging DFA states that behave the same',
      'scanner-generator': 'a tool (like lex) that writes a scanner from regular expressions',
    } },
    { n: 77, title: 'Grammars', introduces: {
      grammar: 'rules describing which token sequences are valid',
      'production-rule': 'one rule: name → pattern',
      terminal: 'a token in a grammar',
      nonterminal: 'a named rule in a grammar',
    } },
    { n: 78, title: 'Writing grammars down: BNF', introduces: {
      bnf: 'the notation for writing grammars',
    } },
    { n: 79, title: 'Derivations and parse trees', introduces: {
      derivation: 'rewriting the start symbol, one rule at a time, into a sentence',
      'parse-tree': 'the tree a derivation draws',
    } },
    { n: 80, title: 'Ambiguity and the Chomsky hierarchy', introduces: {
      ambiguity: 'one sentence with two different parse trees',
      'chomsky-hierarchy': 'regular, context-free, context-sensitive and unrestricted grammars',
    } },
    { n: 81, title: 'Syntax trees', introduces: {
      ast: 'abstract syntax tree: the program as nested nodes',
      'ast-node': 'one node: a kind plus its children',
      'expression-vs-statement': 'expressions produce values, statements do things',
    } },
    { n: 82, title: 'Printing trees', introduces: {
      'tree-printer': 'turning a tree back into text to check it',
    } },
    { n: 83, title: 'Recursive descent parsing', introduces: {
      parser: 'turns tokens into a syntax tree',
      'recursive-descent': 'one function per grammar rule, calling each other',
    } },
    { n: 84, title: 'Precedence and associativity', introduces: {
      precedence: 'which operators bind tighter',
      associativity: 'how a - b - c groups',
    } },
    { n: 85, title: 'Pratt parsing', introduces: { 'pratt-parser': 'parsing expressions with binding powers', 'binding-power': 'how strongly an operator holds its operands', 'prefix-infix': 'operators before vs between operands' } },
    { n: 86, title: 'Syntax errors and recovery', introduces: { 'syntax-error': 'source that breaks the grammar', 'error-recovery': 'resynchronizing so more errors can be reported', 'panic-mode': 'skipping tokens to a safe point' } },
    { n: 87, title: 'FIRST and FOLLOW', introduces: {
      'first-set': 'the tokens a rule can start with',
      'follow-set': 'the tokens that can come after a nonterminal',
    } },
    { n: 88, title: 'LL(1) tables and rewriting grammars', introduces: {
      'll1-table': 'a table that picks the rule from one token of lookahead',
      'left-recursion-elimination': 'rewriting A → A x so a top-down parser can use it',
    } },
    { n: 89, title: 'Bottom-up parsing: shift and reduce', introduces: {
      'shift-reduce': 'parsing by pushing tokens and replacing rule bodies with their heads',
      'bottom-up-parsing': 'building the parse tree from the leaves up',
    } },
    { n: 90, title: 'Handles and the LR driver', introduces: {
      'lr-handle': 'the part of the stack that should be reduced next',
    } },
    { n: 91, title: 'LR(0) items and the LR automaton', introduces: {
      'lr0-item': 'a rule with a dot showing how much has been seen',
      'closure-goto': 'the two operations that build LR states',
      'lr-automaton': 'the DFA over items that drives an LR parser',
    } },
    { n: 92, title: 'The LR parse table and conflicts', introduces: {
      'lr-conflict': 'shift/reduce and reduce/reduce conflicts',
    } },
    { n: 93, title: 'SLR parsing: lookahead from FOLLOW sets', introduces: {
      slr: 'LR(0) states with FOLLOW sets for lookahead',
      'lookahead-set': 'the tokens that allow a reduction',
    } },
    { n: 94, title: 'LR(1) and LALR', introduces: {
      lr1: 'items that carry their own lookahead token',
      lalr: 'LR(1) states merged when their cores match',
    } },
    { n: 95, title: 'Parser generators and PEGs', introduces: {
      'parser-generator': 'a tool that builds a parser from a grammar',
      peg: 'parsing expression grammars: ordered choice',
    } },
    { n: 96, title: 'GLR, Earley and incremental parsing', introduces: {
      glr: 'generalised LR: following every choice at once',
      'incremental-parsing': 'reparsing only what an edit changed',
    } },
    { n: 97, title: 'Running expressions: a tree that computes', introduces: { evaluate: 'computing the value of a tree', 'tree-walking-interpreter': 'an interpreter that walks the syntax tree', 'runtime-value': 'how values are represented while running', truthiness: 'which values count as true', 'runtime-error': 'an error found while running' } },
    { n: 98, title: 'Doing things in order: statements and variables', introduces: { 'global-variable': 'a variable visible everywhere', 'side-effect': 'a change a statement makes to the world', 'program-as-list': 'a program is a list of statements' } },
    { n: 99, title: 'Environments and scope', introduces: { environment: 'a table from names to values, with a parent', 'scope-chain': 'looking a name up through parent environments', shadowing: 'an inner variable hiding an outer one' } },
    { n: 100, title: 'Choosing and repeating: if, while and for', introduces: { 'control-flow': 'deciding which statement runs next', desugaring: 'rewriting a construct in terms of simpler ones', 'short-circuit': 'and/or skipping the right side' } },
    { n: 101, title: 'Functions in Drip', introduces: { callable: 'a runtime value you can call', arity: 'how many arguments a function takes', 'native-function': 'a function implemented by the host language' } },
    { n: 102, title: 'Return and the call stack', introduces: { 'return-unwinding': 'jumping out of nested statements on return', 'host-stack': 'the interpreter reusing its host language’s call stack' } },
    { n: 103, title: 'Closures in Drip', introduces: { 'captured-environment': 'a function remembering the environment it was made in', 'environment-lifetime': 'environments outliving the call that made them' } },
    { n: 104, title: 'Finding every name before running: the resolver', introduces: { resolver: 'a pass that works out which declaration each name refers to', 'static-analysis': 'learning about a program without running it', 'scope-depth': 'how many environments up a variable lives' } },
    { n: 105, title: 'Records with behaviour: classes in Drip', introduces: { 'drip-class': 'classes in the interpreter', field: 'per-instance data', 'bound-method': 'a method remembering its this' } },
    { n: 106, title: 'Inheritance, and measuring the tree-walker', introduces: { inheritance: 'a class reusing another class’s methods', super: 'calling the parent class’s method', 'interpreter-overhead': 'why walking trees is slow' } },
    { n: 107, title: 'Syntax-directed translation and attribute grammars', introduces: {
      'syntax-directed-translation': 'attaching actions to grammar rules',
      'attribute-grammar': 'a grammar whose nodes carry computed values',
      'synthesized-attribute': 'a value computed from a node’s children',
      'inherited-attribute': 'a value passed down from a node’s parent',
    } },
    { n: 108, title: 'The lambda calculus', introduces: {
      'lambda-calculus': 'a whole language made of functions and nothing else',
      'beta-reduction': 'applying a function by substituting its argument',
      substitution: 'replacing a variable, carefully, without capturing names',
      'free-and-bound-variables': 'variables defined outside and inside a function',
    } },
    { n: 109, title: 'Operational semantics', introduces: {
      'operational-semantics': 'defining a language by rules for how programs run',
      'small-step-semantics': 'one tiny step of evaluation at a time',
      'big-step-semantics': 'an expression and its final value in one rule',
    } },
    { n: 110, title: 'What a type system promises', introduces: {
      'type-system': 'rules that classify program pieces by the values they produce',
      'static-vs-dynamic-typing': 'checking types before running, or while running',
      'type-error': 'an operation applied to the wrong kind of value',
      'type-soundness-intro': 'the promise that well-typed programs do not go wrong',
    } },
    { n: 111, title: 'Reading typing rules', introduces: {
      'typing-judgment': 'Γ ⊢ e : T, read “in context Γ, e has type T”',
      'inference-rule': 'premises above a line, a conclusion below it',
      'type-environment': 'Γ: the types of the names in scope',
    } },
    { n: 112, title: 'A type checker for typed Drip', introduces: {
      'type-checker': 'a pass that applies the typing rules to a program',
      'typed-drip': 'Drip with optional type annotations',
      'type-annotation-checking': 'comparing declared types with computed ones',
    } },
    { n: 113, title: 'Unification', introduces: {
      'type-variable': 'a placeholder for a type not yet known',
      unification: 'solving equations between types',
      'occurs-check': 'refusing to solve α = List<α>',
    } },
    { n: 114, title: 'Hindley–Milner type inference', introduces: {
      'hindley-milner': 'complete type inference for a language with let-polymorphism',
      'let-polymorphism': 'a let-bound function used at several types',
      generalization: 'turning leftover type variables into ∀',
      instantiation: 'giving a ∀ type fresh variables at each use',
    } },
    { n: 115, title: 'Subtyping and variance', introduces: {
      subtyping: 'S <: T: an S can be used wherever a T is expected',
      'structural-vs-nominal': 'compatible by shape, or by declared name',
      variance: 'how subtyping of parts carries to wholes: co-, contra- and invariance',
    } },
    { n: 116, title: 'Bidirectional checking and soundness', introduces: {
      'bidirectional-typing': 'checking mode and synthesis mode',
      soundness: 'progress and preservation, stated and proved',
      'progress-preservation': 'well-typed terms step, and stay well-typed',
      'unsound-by-design': 'where TypeScript chose convenience over soundness',
    } },
    { n: 117, title: 'Beyond: System F, dependent and linear types', introduces: {
      'system-f': 'the polymorphic lambda calculus',
      'dependent-types': 'types that mention values',
      'linear-types': 'values that must be used exactly once',
      'effect-systems': 'types that track what code may do',
    } },
  ],
};
