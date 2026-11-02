// New references for chapter 297. Checked 2026-11-02. Only GitHub raw was
// reachable from this session, so the two papers were checked through web
// search (ACM and CACM listings, DSpace@MIT, course bibliographies); their
// full texts were not read. The chapter also relies on v8-trash-talk and
// v8-orinoco-scavenger (re-read raw from v8/v8.dev main: young generation
// split into nursery and intermediate; remembered sets maintained
// per-page, “the majority of the root set”). Evidence produced in this
// session: OpenJDK 21.0.12 (`java -XX:+UseSerialGC -Xmx128m -Xlog:gc` and
// `-Xlog:gc+age=trace` on a loop making 50 million records and keeping one
// in a hundred: “Pause Young (Allocation Failure) 35M->1M(123M) 2.152ms”;
// “Age table with threshold 15 (max threshold 15)”, “age 1: 475560 bytes”,
// “age 2: 419328 bytes”; `-XX:+PrintFlagsFinal` showing GCCardSizeInBytes
// = 512, MaxTenuringThreshold = 15, SurvivorRatio = 8), and Node v22.23.4
// (`node --v8-options`: --scavenger-max-new-space-capacity-mb default 8,
// “When pointer compression is disabled, twice the capacity is used.”).
export default [
  {
    id: 'lieberman1983',
    authors: ['Henry Lieberman', 'Carl Hewitt'],
    title: 'A Real-Time Garbage Collector Based on the Lifetimes of Objects',
    venue: 'Communications of the ACM 26(6), pp. 419–429',
    year: 1983,
    doi: '10.1145/358141.358147',
    url: 'https://doi.org/10.1145/358141.358147',
    accessed: '2026-11-02',
    checkedAgainst: 'Web search on 2026-11-02: the CACM listing (cacmb4.acm.org/magazines/1983/6/10666) and a BibTeX entry give CACM 26(6), June 1983, pp. 419–429, with DOI 10.1145/358141.358147 matching the ACM record; DSpace@MIT (handle 1721.1/6335) holds the earlier AI Lab memo. The abstract: conventional collectors spend as much reclaiming short-lived objects as long-lived ones; the proposed collector, an extension of Baker’s, makes storage for short-lived objects cheaper, by dividing the address space into regions handled separately. The full text was not read.',
    shaped: 'Chapter 297: the origin of collecting by object age.',
  },
  {
    id: 'ungar1984',
    authors: ['David Ungar'],
    title: 'Generation Scavenging: A Non-disruptive High Performance Storage Reclamation Algorithm',
    venue: 'ACM SIGPLAN Notices 19(5) (Proceedings of the ACM SIGSOFT/SIGPLAN Software Engineering Symposium on Practical Software Development Environments), pp. 157–167',
    year: 1984,
    doi: null,
    url: 'https://people.cs.umass.edu/~emery/classes/cmpsci691s-fall2004/papers/p157-ungar.pdf',
    accessed: '2026-11-02',
    checkedAgainst: 'Web search on 2026-11-02: bibliographies (the USENIX JVM ’02 paper bibliography among them) give D. Ungar, ACM SIGPLAN Notices 19(5):157–167, 1984; course slides (UT Austin CS395T) summarise that old-to-new references are added to a remembered set so the scavenger need not trace the old generation; the Squeak VM documentation describes its Spur scavenger as an implementation of Ungar’s Generation Scavenging that scavenges the remembered set. The DOI could not be confirmed, so none is given; the PDF copy at the URL above was found but could not be opened from this session.',
    shaped: 'Chapter 297: copying young objects and keeping a remembered set of old-to-new references as roots.',
  },
  {
    id: 'hotspot-card-table',
    authors: ['Oracle and/or its affiliates (OpenJDK)'],
    title: 'HotSpot card table and its barriers (cardTable.hpp, cardTable.cpp, cardTableBarrierSet.inline.hpp, g1BarrierSet.inline.hpp)',
    venue: 'OpenJDK source, github.com/openjdk/jdk21u (master)',
    year: 2023,
    doi: null,
    url: 'https://github.com/openjdk/jdk21u/blob/master/src/hotspot/share/gc/shared/cardTable.hpp',
    accessed: '2026-11-02',
    checkedAgainst: 'Read raw from raw.githubusercontent.com/openjdk/jdk21u/master on 2026-11-02. cardTable.hpp: CardValue is one byte (“All code generators assume that the size of a card table entry is one byte”); clean_card = (CardValue)-1, dirty_card = 0; byte_for(p) returns &_byte_map_base[uintptr_t(p) >> _card_shift]. cardTable.cpp: _card_size = GCCardSizeInBytes; _card_shift = log2i_exact(_card_size); BOTConstants and ObjectStartArray are initialised from the card shift. cardTableBarrierSet.inline.hpp: write_ref_field_post(field) is `volatile CardValue* byte = _card_table->byte_for(field); *byte = CardTable::dirty_card_val();`. g1BarrierSet.inline.hpp: write_ref_field_post takes the slow path only `if (*byte != G1CardTable::g1_young_card_val())`; write_ref_field_pre enqueues the old value of the field on the SATB mark queue when marking is active.',
    shaped: 'Chapters 297 and 298: card marking with one byte per card and a shift; G1’s young-card filter; G1’s snapshot-at-the-beginning pre-barrier.',
  },
  {
    id: 'hotspot-gc-flags',
    authors: ['Oracle and/or its affiliates (OpenJDK)'],
    title: 'HotSpot garbage collector flags (gc_globals.hpp)',
    venue: 'OpenJDK source, github.com/openjdk/jdk21u (master)',
    year: 2023,
    doi: null,
    url: 'https://github.com/openjdk/jdk21u/blob/master/src/hotspot/share/gc/shared/gc_globals.hpp',
    accessed: '2026-11-02',
    checkedAgainst: 'Read raw on 2026-11-02: GCCardSizeInBytes default 512, “Card table entry size (in bytes) for card based collectors”, range 128 to 1024 on 64-bit; SurvivorRatio default 8, “Ratio of eden/survivor space size”; NewRatio default 2, “Ratio of old/new generation sizes”; MaxTenuringThreshold default 15, “Maximum value for tenuring threshold”. The same defaults were printed by `java -XX:+PrintFlagsFinal -version` on OpenJDK 21.0.12.',
    shaped: 'Chapter 297: card size, eden and survivor spaces, and the tenuring threshold.',
  },
  {
    id: 'dotnet-gc-botr',
    authors: ['Maoni Stephens'],
    title: 'Garbage Collection Design (The Book of the Runtime)',
    venue: 'dotnet/runtime repository, docs/design/coreclr/botr/garbage-collection.md',
    year: 2015,
    doi: null,
    url: 'https://github.com/dotnet/runtime/blob/main/docs/design/coreclr/botr/garbage-collection.md',
    accessed: '2026-11-02',
    checkedAgainst: 'Read raw from raw.githubusercontent.com/dotnet/runtime/main on 2026-11-02: small objects (< 85,000 bytes) and large objects; “The CLR GC is a generational collector”, gen0, gen1 and gen2 for small objects, gen0 and gen1 being the ephemeral generations; “The GC uses cards for the older generation marking. Cards are set by JIT helpers during assignment operations. If the JIT helper sees an object in the ephemeral range it will set the byte that contains the card representing the source location. During ephemeral collections, the GC can look at the set cards for the rest of the heap and only look at the objects that these cards correspond to.”; the plan phase “simulates a compaction” and compacts if productive, otherwise sweeps; sweep puts free objects on a free list; allocation contexts per thread, an allocation quantum “typically 8k”; background GC lets managed threads keep allocating while it runs.',
    shaped: 'Chapters 297 and 300: .NET’s card marking, generations, compact-or-sweep decision, allocation contexts and background GC.',
  },
];
