// New references for chapter 248 (and its staged second half, 236-b).
export default [
  {
    id: 'llvm-machinepipeliner',
    authors: ['The LLVM Project'],
    title: 'MachinePipeliner.cpp: the machine software pipeliner pass',
    venue: 'llvm-project repository, llvm/lib/CodeGen/MachinePipeliner.cpp',
    year: null,
    doi: null,
    url: 'https://github.com/llvm/llvm-project/blob/main/llvm/lib/CodeGen/MachinePipeliner.cpp',
    accessed: '2026-11-02',
    checkedAgainst: 'https://raw.githubusercontent.com/llvm/llvm-project/main/llvm/lib/CodeGen/MachinePipeliner.cpp, header comment read on 2026-11-02: “An implementation of the Swing Modulo Scheduling (SMS) software pipeliner. This SMS implementation is a target-independent back-end pass. When enabled, the pass runs just prior to the register allocation pass, while the machine IR is in SSA form. If software pipelining is successful, then the original loop is replaced by the optimized loop. The optimized loop contains one or more prolog blocks, the pipelined kernel, and one or more epilog blocks. If the instructions cannot be scheduled in a given MII, we increase the MII by one and try again.” and “In order for the SMS pass to work, several target specific hooks need to be implemented to get information about the loop structure and to rewrite instructions.”',
    shaped: 'Chapters 248 and 248-b: software pipelining in a production compiler, its prologue, kernel and epilogue, and retrying with a larger initiation interval.',
  },
  {
    id: 'rau1994',
    authors: ['B. Ramakrishna Rau'],
    title: 'Iterative Modulo Scheduling: An Algorithm for Software Pipelining Loops',
    venue: 'Proceedings of the 27th Annual International Symposium on Microarchitecture (MICRO-27), San Jose, pp. 63–74',
    year: 1994,
    doi: null,
    url: 'https://american.cs.ucdavis.edu/Micro27/html/abst7.html',
    accessed: '2026-11-02',
    checkedAgainst: 'Web search results only: the MICRO-27 programme and abstract pages at american.cs.ucdavis.edu (as shown in search results: the conference was in San Jose, 30 November to 2 December 1994, and the abstract says the paper presents iterative modulo scheduling, a practical algorithm capable of dealing with realistic machine models, and treats modulo scheduling as a framework within which algorithms and heuristics for software pipelining innermost loops can be defined); University of Michigan EECS 583 lecture slides, which cite it as MICRO-27, 1994, pp. 63–74; and dblp’s listing of the extended journal version, “Iterative Modulo Scheduling”, International Journal of Parallel Programming 24(1): 3–65 (1996). The ucdavis.edu, dblp and doi.org hosts could not be fetched from this session, so the paper itself was not read, and the DOI is left out. The outline of the algorithm (start at MII; place operations by priority in the window Estart to Estart + II − 1; when no slot is free, place the operation anyway and unschedule the operations it conflicts with; a budget limits this backtracking before II is raised) was checked against the University of Michigan EECS 583 slides on iterative modulo scheduling (“Budget_ratio is a measure of the amount of backtracking that can be performed before giving up and trying a higher II”), IIT Hyderabad course notes on software pipelining, and US patent 8,924,691, as shown in web search results.',
    shaped: 'Chapter 248-b: the minimum initiation interval from resources and recurrences, the modulo reservation table, and scheduling with a budget, evicting and raising the interval when it runs out.',
  },
];
