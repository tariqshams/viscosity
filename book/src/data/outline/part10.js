export default {
  id: 'X', section: 'deep', days: '1–5', title: 'Deep dive: parsing and automata theory',
  blurb: 'Regular expressions and finite automata, regex to NFA to DFA, the Chomsky hierarchy, FIRST and FOLLOW, LL(1), LR(0), SLR, LALR and LR(1), parser generators, PEGs and incremental parsing, and attribute grammars.',
  chapters: [
    { n: 168, title: 'Regular expressions as a language', introduces: {
      'regular-expression': 'a pattern built from characters, choice, sequence and repetition',
      'regex-operators': 'concatenation, alternation (|) and Kleene star (*)',
      'regular-language': 'the set of strings a regular expression matches',
    } },
    { n: 169, title: 'Finite automata', introduces: {
      'finite-automaton': 'a machine with finitely many states that reads one character at a time',
      dfa: 'a deterministic finite automaton: one next state per character',
      'accepting-state': 'a state where the input so far is a match',
    } },
    { n: 170, title: 'Nondeterministic automata', introduces: {
      nfa: 'a nondeterministic finite automaton: several possible next states, and ε-moves',
    } },
    { n: 171, title: 'From regular expressions to fast scanners', introduces: {
      'thompson-construction': 'building an NFA from a regular expression, piece by piece',
      'subset-construction': 'turning an NFA into a DFA by tracking sets of states',
    } },
    { n: 172, title: 'Minimal DFAs and scanner generators', introduces: {
      'dfa-minimization': 'merging DFA states that behave the same',
      'scanner-generator': 'a tool (like lex) that writes a scanner from regular expressions',
    } },
    { n: 173, title: 'The Chomsky hierarchy', introduces: {} },
    { n: 174, title: 'FIRST and FOLLOW', introduces: {
      'first-set': 'the tokens a rule can start with',
      'follow-set': 'the tokens that can come after a nonterminal',
    } },
    { n: 175, title: 'LL(1) tables and rewriting grammars', introduces: {
      'll1-table': 'a table that picks the rule from one token of lookahead',
      'left-recursion-elimination': 'rewriting A → A x so a top-down parser can use it',
    } },
    { n: 176, title: 'Bottom-up parsing: shift and reduce', introduces: {
      'bottom-up-parsing': 'building the parse tree from the leaves up',
      'shift-reduce': 'parsing by pushing tokens and replacing rule bodies with their heads',
    } },
    { n: 177, title: 'Handles and the LR driver', introduces: {
      'lr-handle': 'the part of the stack that should be reduced next',
    } },
    { n: 178, title: 'LR(0) items and the LR automaton', introduces: {
      'lr0-item': 'a rule with a dot showing how much has been seen',
      'closure-goto': 'the two operations that build LR states',
      'lr-automaton': 'the DFA over items that drives an LR parser',
    } },
    { n: 179, title: 'The LR parse table and conflicts', introduces: {
      'lr-conflict': 'shift/reduce and reduce/reduce conflicts',
    } },
    { n: 180, title: 'SLR parsing: lookahead from FOLLOW sets', introduces: {
      slr: 'LR(0) states with FOLLOW sets for lookahead',
      'lookahead-set': 'the tokens that allow a reduction',
    } },
    { n: 181, title: 'LR(1) and LALR', introduces: {
      lr1: 'items that carry their own lookahead token',
      lalr: 'LR(1) states merged when their cores match',
    } },
    { n: 182, title: 'Parser generators and PEGs', introduces: {
      'parser-generator': 'a tool that builds a parser from a grammar',
      peg: 'parsing expression grammars: ordered choice',
    } },
    { n: 183, title: 'GLR, Earley and incremental parsing', introduces: {
      glr: 'generalised LR: following every choice at once',
      'incremental-parsing': 'reparsing only what an edit changed',
    } },
    { n: 184, title: 'Syntax-directed translation and attribute grammars', introduces: {
      'syntax-directed-translation': 'attaching actions to grammar rules',
      'synthesized-attribute': 'a value computed from a node’s children',
    } },
    { n: 185, title: 'Inherited attributes and attribute grammars', introduces: {
      'attribute-grammar': 'a grammar whose nodes carry computed values',
      'inherited-attribute': 'a value passed down from a node’s parent',
    } },
  ],
};
