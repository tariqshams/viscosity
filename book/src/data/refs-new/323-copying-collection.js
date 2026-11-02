// New references for chapter 296. Checked 2026-11-02. Only GitHub raw was
// reachable from this session (doi.org, dl.acm.org, api.crossref.org and
// publishers' pages were not), so the papers below were checked through
// web search against the CACM issue listing, Wikipedia's citation and
// course bibliographies; their full texts were not read. The chapter also
// relies on v8-trash-talk (re-read raw from v8/v8.dev main,
// src/blog/trash-talk.md: after a scavenge "new allocations happen at the
// next free address in the From-Space"; parallel scavenging "leaves a
// forwarding pointer so that other workers which reach the object can
// update other pointers"), v8-orinoco-scavenger and v8-gc-tracer.
// Evidence produced in this session: `node --trace-gc` on Node v22.23.4
// (the Scavenge line quoted, reason "allocation failure"), and the
// RangeError from the recursive copier, run in Node v22.23.4.
export default [
  {
    id: 'cheney1970',
    authors: ['C. J. Cheney'],
    title: 'A Nonrecursive List Compacting Algorithm',
    venue: 'Communications of the ACM 13(11), pp. 677–678',
    year: 1970,
    doi: '10.1145/362790.362798',
    url: 'https://doi.org/10.1145/362790.362798',
    accessed: '2026-11-02',
    checkedAgainst: 'Web search on 2026-11-02: the CACM November 1970 issue listing (cacm.acm.org/issue/november-1970 and cacmb4.acm.org/magazines/1970/11/12288) and Wikipedia’s “Cheney’s algorithm” citation give C. J. Cheney (University Mathematical Laboratory, Cambridge), CACM 13(11):677–678, November 1970, DOI 10.1145/362790.362798. The listing’s summary: the partially built copy is used as the record of which lists have been copied, so no recursion is needed; secondary sources describe it as a breadth-first copying traversal. The full text (behind the ACM paywall) was not read, so only those facts are relied on.',
    shaped: 'Chapter 296: Cheney’s nonrecursive, breadth-first copying, with to-space used as the queue.',
  },
  {
    id: 'gchandbook2012',
    authors: ['Richard Jones', 'Antony Hosking', 'Eliot Moss'],
    title: 'The Garbage Collection Handbook: The Art of Automatic Memory Management',
    venue: 'CRC Press (Chapman & Hall), ISBN 978-1-4200-8279-1',
    year: 2012,
    doi: null,
    url: 'https://gchandbook.org/',
    accessed: '2026-11-02',
    checkedAgainst: 'Web search on 2026-11-02 (MIT Press Bookstore and AbeBooks listings for ISBN 9781420082791; the ANU research portal record, which lists the authors Jones, Hosking and Moss and a 2023 second edition): the 2012 first edition by Richard Jones, Antony Hosking and Eliot Moss, CRC Press. Go’s runtime/mgc.go (go1.24.7, read raw) and .NET’s docs/design/coreclr/botr/garbage-collection.md (dotnet/runtime main, read raw) both point readers to it as the general reference. The book itself was not available in this session, so it is cited only as the standard survey behind the chapters’ textbook definitions; no quotation or page from it is relied on.',
    shaped: 'Chapters 296–300: the standard survey of tracing, copying, generational, incremental and compacting collection.',
  },
];
