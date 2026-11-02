// New references for chapter 270 (Compiling pattern matching).
// Checked 2026-11-02 in the writing session. The two papers were read in
// full-text copies hosted in the Papers We Love repository on GitHub
// (raw.githubusercontent.com/papers-we-love/papers-we-love, main, commit
// 0b33c953aae0), because the publishers’ sites, doi.org and the authors’
// pages could not be reached from the session; their DOIs and venues were
// confirmed by web search against the Cambridge University Press listing and
// a citing paper. The rustc output the chapter quotes (MIR, error E0004 and
// the unreachable-pattern warning) came from rustc 1.97.0, and the Java
// bytecode from javac/javap 21.0.12, in the same session.
export default [
  {
    id: 'maranget2008',
    authors: ['Luc Maranget'],
    title: 'Compiling Pattern Matching to Good Decision Trees',
    venue: 'Proceedings of the 2008 ACM SIGPLAN Workshop on ML (ML ’08), Victoria, BC, Canada, pages 35–46',
    year: 2008,
    doi: '10.1145/1411304.1411311',
    url: 'https://doi.org/10.1145/1411304.1411311',
    accessed: '2026-11-02',
    checkedAgainst: 'Full text (header “Submitted to ML’08”) read from papers-we-love/papers-we-love, pattern_matching/compiling-pattern-matching-to-good-decision-trees.pdf, on 2026-11-02. Introduction: “Matching automata fall in two categories: decision trees and backtracking automata … The primary advantage of the technique [backtracking automata] is a linear guarantee for code size. However, backtracking automata may backtrack and, at the occasion, they may scan subterms more than once … In this paper we study compilation to decision tree, whose primary advantage is never testing a given subterm of the subject value more than once (and whose primary drawback is potential code size explosion).” “Compilation to decision can be very sensitive to the testing order of subject value subterms.” The paper designs heuristics for choosing the column to test. DOI 10.1145/1411304.1411311 and pages 35–46 confirmed by web search (ACM proceedings of the 2008 ACM SIGPLAN Workshop on ML).',
    shaped: 'Chapter 270: the definition of a decision tree (each subterm tested at most once), the trade-off with backtracking automata, and column-choice heuristics.',
  },
  {
    id: 'maranget2007',
    authors: ['Luc Maranget'],
    title: 'Warnings for pattern matching',
    venue: 'Journal of Functional Programming 17(3), page 387',
    year: 2007,
    doi: '10.1017/S0956796807006223',
    url: 'https://doi.org/10.1017/S0956796807006223',
    accessed: '2026-11-02',
    checkedAgainst: 'Full text (preprint, “Under consideration for publication in J. Functional Programming”) read from papers-we-love/papers-we-love, pattern_matching/warnings-for-pattern-matching.pdf, on 2026-11-02. Abstract: “We examine the ML pattern-matching anomalies of useless clauses and non-exhaustive matches. We state the definition of these anomalies, building upon pattern matching semantics, and propose a simple algorithm to detect them. We have integrated the algorithm in the Objective Caml compiler.” Introduction: “the decision tree technique has one advantage: checks can be carried on the decision trees, since decision trees are complete and include no dead code. By contrast, backtracking automata cannot be easily analyzed.” Volume, issue, page and DOI confirmed by web search (Cambridge University Press listing, published online 15 February 2007).',
    shaped: 'Chapter 270: usefulness as the single question behind exhaustiveness and redundancy checks; decision trees being easy to analyse.',
  },
  {
    id: 'rustc-dev-guide-exhaustiveness',
    authors: ['The Rust compiler team'],
    title: 'Pattern and exhaustiveness checking',
    venue: 'Rust Compiler Development Guide',
    year: null,
    doi: null,
    url: 'https://rustc-dev-guide.rust-lang.org/pat-exhaustive-checking.html',
    accessed: '2026-11-02',
    checkedAgainst: 'src/pat-exhaustive-checking.md read raw from github.com/rust-lang/rustc-dev-guide (main, commit 4dea1e00769b) on 2026-11-02: usefulness asks whether “given a list of patterns we have already seen, a given new pattern might match any new value”; a redundant arm “will get an ‘unreachable’ warning”; “we can ask whether the whole match is exhaustive by asking whether the wildcard pattern (_) is useful relative to the list of all the patterns”; usefulness is used “for detecting unreachable code … and ensuring that matches are exhaustive (which is important for soundness, because a match expression can return a value)”; constructors, fields and arity (“Some has arity 1, None and 42 have arity 0”).',
    shaped: 'Chapter 270: what exhaustiveness and redundancy checking are for in Rust, and the vocabulary of constructors and fields.',
  },
  {
    id: 'rustc-usefulness',
    authors: ['The Rust compiler team'],
    title: 'usefulness.rs (rustc_pattern_analysis, Rust compiler source)',
    venue: 'rust-lang/rust, compiler/rustc_pattern_analysis/src/usefulness.rs',
    year: null,
    doi: null,
    url: 'https://github.com/rust-lang/rust/blob/main/compiler/rustc_pattern_analysis/src/usefulness.rs',
    accessed: '2026-11-02',
    checkedAgainst: 'Read raw from github.com/rust-lang/rust (main, commit 4c46afa63688) on 2026-11-02. Module documentation: “The algorithm implemented here is inspired from the one described in this paper” (linking Maranget’s “Warnings for pattern matching”); “Fun fact: computing exhaustiveness is NP-complete, because we can encode a SAT problem as an exhaustiveness problem.” Section “Specialization”: “specialize(c, p) takes a value-only constructor c and a pattern p … Specializing for the wrong constructor returns nothing … Specializing for the correct constructor returns a tuple of the fields”, extended to rows as “specialize(c, (p_0, .., p_n)) := specialize(c, p_0) ++ (p_1, .., p_m)”. rustc 1.97.0 printed “error[E0004]: non-exhaustive patterns: `&Sh::Re(_, _)` not covered” and “warning: unreachable pattern … no value can reach this” for the chapter’s examples.',
    shaped: 'Chapter 270: the specialisation rule, Rust’s checker being based on Maranget’s algorithm, and NP-completeness of exhaustiveness.',
  },
  {
    id: 'openjdk-switchbootstraps',
    authors: ['Oracle and the OpenJDK contributors'],
    title: 'SwitchBootstraps.java (java.lang.runtime, OpenJDK source)',
    venue: 'openjdk/jdk, src/java.base/share/classes/java/lang/runtime/SwitchBootstraps.java',
    year: null,
    doi: null,
    url: 'https://github.com/openjdk/jdk/blob/master/src/java.base/share/classes/java/lang/runtime/SwitchBootstraps.java',
    accessed: '2026-11-02',
    checkedAgainst: 'Read raw from github.com/openjdk/jdk (master, commit 774c5d1afcd3) on 2026-11-02. Javadoc of typeSwitch: the call site’s method “returns the index of the first element in the labels array starting from the restart index matching one of the following conditions: the element is of type Class that is assignable from the target’s class …”; “If no element in the labels array matches the target, then the method of the call site return the length of the labels array”; for a null target it returns -1. javap -c (JDK 21.0.12) on the chapter’s Sw.area showed invokedynamic … typeSwitch, then lookupswitch { 0: 54, 1: 71, default: 44 }, with 44: new java/lang/MatchException.',
    shaped: 'Chapter 270: how Java 21 compiles a pattern switch, as a typeSwitch call followed by a jump table.',
  },
  {
    id: 'openjdk-matchexception',
    authors: ['Oracle and the OpenJDK contributors'],
    title: 'MatchException.java (java.lang, OpenJDK source)',
    venue: 'openjdk/jdk, src/java.base/share/classes/java/lang/MatchException.java',
    year: null,
    doi: null,
    url: 'https://github.com/openjdk/jdk/blob/master/src/java.base/share/classes/java/lang/MatchException.java',
    accessed: '2026-11-02',
    checkedAgainst: 'Read raw from github.com/openjdk/jdk (master, commit 774c5d1afcd3) on 2026-11-02: “MatchException may be thrown when an exhaustive pattern matching language construct (such as a switch expression) encounters a value that does not match any of the specified patterns at run time, even though the construct has been deemed exhaustive … Separate compilation anomalies … For example, if a sealed interface has a different set of permitted subtypes at run time than it had at compile time”.',
    shaped: 'Chapter 270: why a pattern switch that javac proved exhaustive still has a default that throws MatchException.',
  },
];
