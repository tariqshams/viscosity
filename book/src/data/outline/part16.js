export default {
  id: 'XVI', section: 'deep', days: '32–34', title: 'Deep dive: garbage collection in depth',
  blurb: 'Generational collection, V8’s Orinoco, copying and compacting collectors, incremental and concurrent marking with barriers, weak references and finalisation, and real collectors compared.',
  chapters: [
    { n: 293, title: 'NaN-boxing and write barriers in practice', introduces: {} },
    { n: 294, title: 'V8’s garbage collector', introduces: {
      scavenger: 'the young-generation copying collector',
    } },
    { n: 295, title: 'Mark-compact and the write barrier', introduces: {
      'mark-compact': 'old-generation collection with compaction',
      'write-barrier': 'bookkeeping when old objects point at young ones',
    } },
    { n: 296, title: 'Copying collection', introduces: {
      'copying-gc': 'collecting by copying live objects to a fresh space',
      'cheney-scan': 'breadth-first copying with two pointers',
      'forwarding-pointer': 'where a moved object now lives',
    } },
    { n: 297, title: 'Generational collection in depth', introduces: {
      nursery: 'the space new objects are born in',
      'remembered-set': 'old-to-young pointers the collector must know about',
      'card-table': 'a coarse map of dirty memory',
    } },
    { n: 298, title: 'Incremental and concurrent collection', introduces: {
      'incremental-gc': 'collecting in small slices between program work',
      'concurrent-gc': 'collecting while the program runs',
      'snapshot-at-the-beginning': 'a barrier that preserves the start-of-cycle view',
    } },
    { n: 299, title: 'Read barriers and moving objects concurrently', introduces: {
      'read-barrier': 'a check on every pointer read',
    } },
    { n: 300, title: 'Allocation, compaction and real collectors', introduces: {
      'bump-allocation': 'allocating by moving a pointer',
      'free-list': 'a list of free blocks',
      'sliding-compaction': 'moving live objects together, in order',
    } },
    { n: 301, title: 'Weak references, finalisation and real collectors', introduces: {
      'weak-reference': 'a pointer the collector may clear',
      finalization: 'running code when an object dies, and why it is fragile',
      'collector-design-space': 'how V8, the JVM, Go and .NET choose',
    } },
  ],
};
