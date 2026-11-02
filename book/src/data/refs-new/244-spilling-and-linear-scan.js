// New references for chapter 239 (Spilling and linear scan) and its staged
// second half (234-b, linear scan). Network note: dl.acm.org and doi.org
// were unreachable from this session; GitHub could be reached.
export default [
  {
    id: 'poletto1999',
    authors: ['Massimiliano Poletto', 'Vivek Sarkar'],
    title: 'Linear Scan Register Allocation',
    venue: 'ACM Transactions on Programming Languages and Systems 21(5), pp. 895–913',
    year: 1999,
    doi: null,
    url: 'https://algorithm-wiki.csail.mit.edu/wiki/Linear_Scan,_Poletto_%26_Sarkar_(Global_Register_Allocation_Register_Allocation)',
    accessed: '2026-11-02',
    checkedAgainst: 'Search records only (the ACM pages and doi.org were unreachable, and the DOI could not be confirmed, so none is given): reference lists giving “M. Poletto and V. Sarkar. Linear scan register allocation. ACM Trans. Prog. Lang. Syst., 21(5):895–913, Sept. 1999”, with the authors’ affiliations (MIT Laboratory for Computer Science; IBM Thomas J. Watson Research Center) from a full-text copy indexed at cse.iitm.ac.in; the abstract as indexed: a fast global register allocation algorithm, “not based on graph coloring”, that “allocates registers to variables in a single linear-time scan of the variables’ live ranges”; course notes (Cornell CS 4120, IIT Hyderabad, EPITA) describing its input (live intervals sorted by increasing start point), its active list kept in order of increasing end point, and its spill rule (spill the interval, current or active, whose end point is furthest away). The MIT Algorithm Wiki page (the url above) records the algorithm under this paper.',
    shaped: 'Chapter 239-b: live intervals and the linear scan algorithm, including its spill choice.',
  },
  {
    id: 'llvm-regalloc-greedy',
    authors: ['The LLVM Project'],
    title: 'RegAllocGreedy.cpp and RegAllocGreedy.h: the greedy register allocator',
    venue: 'llvm-project repository, llvm/lib/CodeGen (main)',
    year: 2026,
    doi: null,
    url: 'https://github.com/llvm/llvm-project/blob/main/llvm/lib/CodeGen/RegAllocGreedy.cpp',
    accessed: '2026-11-02',
    checkedAgainst: 'A sparse git checkout of github.com/llvm/llvm-project at commit b322d9c0dd016086eead06ede5411d06161f89ce (2 November 2026). RegAllocGreedy.cpp: “This file defines the RAGreedy function pass for register allocation in optimized builds”; live ranges are dequeued by priority (DefaultPriorityAdvisor::getPriority: local ranges in instruction order, global and split ranges “in long->short order”); selectOrSplitImpl “First try assigning a free register”, then “Try to evict a less worthy live range”, then (“The first time we see a live range, don’t try to split or spill. Wait until the second time, when all smaller ranges have been allocated”) tries splitting, and “Finally spill VirtReg itself”; the stages RS_New, RS_Assign, RS_Split, RS_Split2, RS_Spill. The -O0 and -O2 listings in the chapter are llc 18.1.3 output from the writing session.',
    shaped: 'Chapter 239-b: LLVM’s default allocator as a priority queue of live ranges with assign, evict, split and spill.',
  },
  {
    id: 'v8-regalloc-source',
    authors: ['The V8 Project'],
    title: 'V8 register allocators: TurboFan’s LinearScanAllocator and Maglev’s StraightForwardRegisterAllocator',
    venue: 'V8 source, src/compiler/backend/register-allocator.h and src/maglev/maglev-regalloc.h',
    year: 2026,
    doi: null,
    url: 'https://github.com/v8/v8/blob/main/src/compiler/backend/register-allocator.h',
    accessed: '2026-11-02',
    checkedAgainst: 'A sparse git checkout of github.com/v8/v8 at commit 64b57c27d105a9372d1867429fc8474fd212130b (2 November 2026). src/compiler/backend/register-allocator.h declares “class LinearScanAllocator final : public RegisterAllocator”, with live ranges split and spilled (MaybeSpillPreviousRanges, SpillNotLiveRanges) and a comment on the “current linear scan position”; register-allocator.cc implements LinearScanAllocator::AllocateRegisters. src/maglev/maglev-regalloc.h declares “class StraightForwardRegisterAllocator”, with spill slots, Spill(ValueNode*) and a register-frame state in which each register is free or used and blocked or unblocked (“Used + unblocked: Live values that can be spilled if there is register pressure”).',
    shaped: 'Chapter 239-b: V8’s optimizing compiler uses linear scan, and Maglev a simpler single-pass allocator.',
  },
];
