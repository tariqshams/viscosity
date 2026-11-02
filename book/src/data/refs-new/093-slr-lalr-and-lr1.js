// New references for chapter 93 (SLR, LALR and LR(1)) and its staged
// second half (LR(1) and LALR).
// Network note: only web search and raw.githubusercontent.com were
// reachable from this session; each checkedAgainst says what was read.
export default [
  {
    id: 'deremer1969',
    authors: ['Franklin L. DeRemer'],
    title: 'Practical Translators for LR(k) Languages',
    venue: 'PhD thesis, Department of Electrical Engineering, Massachusetts Institute of Technology; also Project MAC report MAC-TR-65',
    year: 1969,
    doi: null,
    url: 'https://dspace.mit.edu/handle/1721.1/149384',
    accessed: '2026-11-02',
    checkedAgainst: 'Search results for the MIT DSpace records (handles 1721.1/13628 and 1721.1/149384: “Practical Translators for LR(k) Languages”, Franklin Lewis DeRemer, Electrical Engineering Ph.D. thesis, 1969, advisor Arthur Evans Jr.) and the bitsavers mirror of MIT-LCS-TR-0065 (October 1969, Project MAC). The Wikipedia articles on LALR parsers and LALR parser generators credit this thesis with inventing LALR parsing, in answer to the practical difficulty at the time of implementing LR(1) parsers, whose tables were too large; the thesis also has a chapter on simple LR(k) grammars.',
    shaped: 'Chapter 93 and its second half: SLR and LALR, the two ways to make LR tables small enough to use.',
  },
  {
    id: 'deremer1971',
    authors: ['Franklin L. DeRemer'],
    title: 'Simple LR(k) grammars',
    venue: 'Communications of the ACM, vol. 14, no. 7, pp. 453–460',
    year: 1971,
    doi: '10.1145/362619.362625',
    url: 'https://doi.org/10.1145/362619.362625',
    accessed: '2026-11-02',
    checkedAgainst: 'Search results: the CACM July 1971 (vol. 14, no. 7) issue listing and the cacm.acm.org article page “Simple LR(k) grammars”; Crossref and Springer reference lists giving DeRemer, F.L. (1971) Simple LR(k) grammars, Commun. ACM 14, 453–460, with DOI 10.1145/362619.362625. The abstract defines the SLR(k) class, shows it contains the simple and weak precedence grammars, and describes how to build parsers for it.',
    shaped: 'Chapter 93: SLR, using FOLLOW sets as the lookahead for LR(0) states.',
  },
  {
    id: 'bison-manual',
    authors: ['Charles Donnelly', 'Richard Stallman'],
    title: 'Bison: The Yacc-compatible Parser Generator (manual for GNU Bison 3.8)',
    venue: 'Free Software Foundation; Texinfo source doc/bison.texi in the Bison repository',
    year: 2021,
    doi: null,
    url: 'https://www.gnu.org/software/bison/manual/',
    accessed: '2026-11-02',
    checkedAgainst: 'https://raw.githubusercontent.com/akimd/bison/master/doc/bison.texi (the manual’s source, read raw; title page “by Charles Donnelly and Richard Stallman”, copyright 1988–2022 Free Software Foundation; gnu.org itself was not reachable) and NEWS in the same repository (latest stable release 3.8.2, 2021-09-25). Read: the rule exp: exp '+' exp { $$ = $1 + $3; } used as an example throughout; Bison resolves a shift/reduce conflict by shifting “unless otherwise directed by operator precedence declarations”, and the dangling else; a reduce/reduce conflict by the rule that appears first in the grammar, “but it is very risky to rely on this”; How Precedence Works (each rule takes the precedence of its last terminal; a higher token precedence shifts, a higher rule precedence reduces, equal precedence uses associativity; with no precedence the default is to shift); %left examples; %expect n; the calc.y example reporting “7 shift/reduce conflicts” with a note to rerun with -Wcounterexamples, and the .output report “State 8 conflicts: 1 shift/reduce”; Mysterious Conflicts (a reduce/reduce conflict in an LR(1) grammar that is not LALR(1), because two contexts were merged into one state); “For historical reasons, Bison constructs LALR(1) parser tables by default”; %define lr.type lalr (default), ielr or canonical-lr; “LALR parser tables are the smallest parser tables Bison can currently construct”; IELR, like LALR, merges states “so that the number of parser states is often an order of magnitude less than for canonical LR”; precedence order: “The first precedence/associativity declaration in the file declares the operators whose precedence is lowest”; and the GLR section (%glr-parser clones the parser at an unresolved conflict, the copies proceed in lockstep, and each either vanishes at an error or merges with another; semantic actions are recorded and run later, and a real ambiguity is settled with %dprec or %merge, or reported as an error; the Pascal example “type subrange = (a) .. b;” against “type enum = (a);”, which look the same until the .. token, so one-token lookahead cannot decide, and a GLR parser splits and lets the wrong branch fail).',
    shaped: 'Chapter 93’s second half: how a real parser generator reports and resolves conflicts, precedence declarations, and LALR’s mysterious conflicts. Chapter 95’s second half: GLR in Bison.',
  },
];
