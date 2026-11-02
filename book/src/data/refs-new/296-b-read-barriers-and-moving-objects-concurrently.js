// New references for staged chapter 325-b (second half of chapter 325).
// Checked 2026-11-02. Only GitHub raw was reachable from this session, so
// Baker's paper was checked through web search; its full text was not
// read. The chapter also relies on lieberman1983 (refs-new/295) and
// v8-trash-talk (re-read raw: compaction of some pages in the final
// pause, in parallel). Evidence produced in this session, OpenJDK
// 21.0.12, a loop making 50 million records with a 128 MB heap:
// `-XX:+UseShenandoahGC -Xlog:gc` (“Concurrent evacuation 2.701ms”,
// “Pause Init Update Refs 0.010ms”, “Concurrent update references
// 4.819ms”, “Pause Final Update Refs 0.018ms”, pauses from 0.007 to
// 0.327 ms); `-XX:+UseZGC -XX:+ZGenerational -Xlog:gc+phases` (“Y: Pause
// Mark Start (Major) 0.016ms”, “Y: Pause Relocate Start 0.011ms”; 67
// pauses, the longest 0.153 ms); `-XX:+UseG1GC -Xlog:gc` young pauses of
// about 2 to 21 ms on the same program.
export default [
  {
    id: 'baker1978',
    authors: ['Henry G. Baker, Jr.'],
    title: 'List Processing in Real Time on a Serial Computer',
    venue: 'Communications of the ACM 21(4), pp. 280–294',
    year: 1978,
    doi: null,
    url: 'https://dspace.mit.edu/handle/1721.1/41976',
    accessed: '2026-11-02',
    checkedAgainst: 'Web search on 2026-11-02: CACM 21(4):280–294, April 1978 (Wikipedia’s Henry Baker article, the CACM site, the PDF in Purdue’s course readings whose ACM copyright line gives page 280, DSpace@MIT 1721.1/41976). The abstract: each elementary list operation takes a bounded time, on a serial computer, without a time-sharing clock. Secondary descriptions (a summary of the paper and the Wilson survey reading list): the collector is invoked at each allocation to copy a few more objects, and a check on each pointer fetch calls the copying routine when the pointer leads into old space. No page opened here showed the DOI, so none is given. The full text was not read.',
    shaped: 'Chapter 325-b: incremental copying with a read barrier, and the to-space invariant.',
  },
  {
    id: 'shenandoah-lrb',
    authors: ['Red Hat, Inc. and Oracle (OpenJDK)'],
    title: 'Shenandoah barriers and evacuation (shenandoahBarrierSet.hpp, shenandoahBarrierSet.inline.hpp, shenandoahForwarding.hpp, shenandoahHeap.inline.hpp)',
    venue: 'OpenJDK source, github.com/openjdk/jdk21u (master)',
    year: 2023,
    doi: null,
    url: 'https://github.com/openjdk/jdk21u/blob/master/src/hotspot/share/gc/shenandoah/shenandoahBarrierSet.inline.hpp',
    accessed: '2026-11-02',
    checkedAgainst: 'Read raw on 2026-11-02. shenandoahBarrierSet.hpp: an SATB mark queue set, satb_barrier and load_reference_barrier. shenandoahBarrierSet.inline.hpp, load_reference_barrier(oop obj): `if (_heap->has_forwarded_objects() && _heap->in_collection_set(obj)) { oop fwd = resolve_forwarded_not_null(obj); if (obj == fwd && _heap->is_evacuation_in_progress()) { … return _heap->evacuate_object(obj, t); } return fwd; } return obj;`. shenandoahForwarding.hpp: try_update_forwardee “Tries to atomically update forwardee … Returns the new object ‘update’ upon success, or the new forwardee that a competing thread installed.” shenandoahHeap.inline.hpp, evacuate_object: on success “Our copy is now the public one!”, otherwise the left-behind copy is dealt with.',
    shaped: 'Chapter 325-b: Shenandoah’s load-reference barrier and the race to publish a copy.',
  },
  {
    id: 'zgc-barrier',
    authors: ['Oracle and/or its affiliates (OpenJDK)'],
    title: 'ZGC load barriers and coloured pointers (zBarrier.hpp, zBarrier.inline.hpp, zAddress.hpp)',
    venue: 'OpenJDK source, github.com/openjdk/jdk21u (master)',
    year: 2023,
    doi: null,
    url: 'https://github.com/openjdk/jdk21u/blob/master/src/hotspot/share/gc/z/zBarrier.hpp',
    accessed: '2026-11-02',
    checkedAgainst: 'Read raw on 2026-11-02. zBarrier.hpp: “The load barriers of ZGC check if a loaded value is safe to expose or not, and then shifts the pointer to remove metadata bits”; a pointer is safe “if it does not have any load-bad bits set”; declares self_heal, relocate_or_remap and remap. zBarrier.inline.hpp: ZBarrier::self_heal (“A self heal must always ‘upgrade’ the address metadata bits”). zAddress.hpp: “A zpointer is a combination of the address bits (heap base bit + offset) and two low-order metadata bytes, with the following layout: RRRRMMmmFFrr0000”, with remembered, finalizable, marked young, marked old and remapped bits, and four reserved bits.',
    shaped: 'Chapter 325-b: coloured pointers, the load-bad mask test and self-healing.',
  },
];
