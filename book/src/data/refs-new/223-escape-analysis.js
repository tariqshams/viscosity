// New references for chapter 95 (Escape analysis).
// Network note: only web search and raw.githubusercontent.com could be
// reached; publisher pages and PDFs on university sites could not be fetched.
export default [
  {
    id: 'choi1999',
    authors: ['Jong-Deok Choi', 'Manish Gupta', 'Mauricio Serrano', 'Vugranam C. Sreedhar', 'Sam Midkiff'],
    title: 'Escape Analysis for Java',
    venue: 'Proceedings of the 14th ACM SIGPLAN Conference on Object-Oriented Programming, Systems, Languages, and Applications (OOPSLA ’99), Denver, ACM',
    year: 1999,
    doi: null,
    url: 'https://faculty.cc.gatech.edu/~harrold/6340/cs6340_fall2009/Readings/choi99escape.pdf',
    accessed: '2026-11-02',
    checkedAgainst: 'Search records: a course copy of the paper (faculty.cc.gatech.edu, “To appear in … OOPSLA99. Denver, Colorado, November 1, 1999”, IBM T. J. Watson Research Center), whose introduction, as shown in search, introduces the connection graph and says “we simply perform reachability analysis on the connection graph to determine if an object is local to a method or local to a thread”, names stack allocation and synchronization elimination as the two applications, and reports execution-time reductions of 2% to 23% (median 7%). Also HotSpot’s escape.hpp (see hotspot-escape), which cites it as “[Choi99]” and restates the connection graph and the escape states. The DOI could not be confirmed and is left out; the PDF itself could not be fetched.',
    shaped: 'Chapter 95: connection graphs, the escape states NoEscape, ArgEscape and GlobalEscape, reachability to decide them, and stack allocation and lock removal as uses.',
  },
  {
    id: 'hotspot-escape',
    authors: ['Oracle and the OpenJDK contributors'],
    title: 'src/hotspot/share/opto/escape.hpp (HotSpot C2’s escape analysis)',
    venue: 'OpenJDK source repository (github.com/openjdk/jdk), master branch',
    year: null,
    doi: null,
    url: 'https://github.com/openjdk/jdk/blob/master/src/hotspot/share/opto/escape.hpp',
    accessed: '2026-11-02',
    checkedAgainst: 'https://raw.githubusercontent.com/openjdk/jdk/master/src/hotspot/share/opto/escape.hpp (master at commit 774c5d1afcd3, read 2026-11-02): “Adaptation for C2 of the escape analysis algorithm described in: [Choi99] … The flow-insensitive analysis described in the paper has been implemented”; node kinds Java objects (JO), local variables (LV) and fields (OF); PointsTo, Deferred and Field edges; the four cases p = new T(), p = q, p.f = q, p = q.f; deleting deferred edges; then GlobalEscape and ArgEscape propagated to everything a node could point to; the EscapeState enum (“NoEscape … could be replaced with scalar”, “ArgEscape … passed as argument to call or referenced by argument and it does not escape during call”, “GlobalEscape … escapes the method or thread”).',
    shaped: 'Chapter 95: the connection graph as a production JIT builds it, and the three escape states quoted from its source.',
  },
];
