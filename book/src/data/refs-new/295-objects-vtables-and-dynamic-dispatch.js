// New references for chapter 295. Checked 2026-11-02 by reading the raw
// files from GitHub (the only hosts reachable from this session). The
// RISC-V listings in the chapter are real output of Ubuntu clang 18.1.3
// (clang++ --target=riscv64 -march=rv64imfd -O2 -S), trimmed to 44
// columns with comments added; the Drip program was run with the book's
// tree-walking interpreter and VM.
export default [
  {
    id: 'itanium-cxx-abi',
    authors: ['CodeSourcery, Compaq, EDG, HP, IBM, Intel, Red Hat, SGI, et al.'],
    title: 'Itanium C++ ABI',
    venue: 'itanium-cxx-abi/cxx-abi, abi.html',
    year: null,
    doi: null,
    url: 'https://itanium-cxx-abi.github.io/cxx-abi/abi.html',
    accessed: '2026-11-02',
    checkedAgainst: 'abi.html read raw from github.com/itanium-cxx-abi/cxx-abi (main branch) on 2026-11-02. Section 2.4 (non-POD class layout): “If C has no primary base class, allocate the virtual table pointer for C at offset zero”. Section 2.5.2 (Virtual Table Components and Order): the offset to top “is always present”, the typeinfo pointer “is always present”, and “The virtual table address point points here, i.e. this is the virtual table address contained in an object’s virtual pointer”, followed by the virtual function pointers. clang 18.1.3 output matched: _ZTV2Sq = 0, _ZTI2Sq, Sq::area, Shape::name, with objects pointing at _ZTV2Sq+16.',
    shaped: 'Chapter 295: where the vptr goes, what a C++ vtable holds, and why the vptr points two words into it.',
  },
  {
    id: 'hotspot-klassvtable',
    authors: ['Oracle and the OpenJDK contributors'],
    title: 'klassVtable.hpp (HotSpot virtual machine source)',
    venue: 'openjdk/jdk, src/hotspot/share/oops/klassVtable.hpp',
    year: null,
    doi: null,
    url: 'https://github.com/openjdk/jdk/blob/master/src/hotspot/share/oops/klassVtable.hpp',
    accessed: '2026-11-02',
    checkedAgainst: 'Read raw from the master branch on 2026-11-02: “A klassVtable abstracts the variable-length vtable that is embedded in InstanceKlass and ArrayKlass”; vtableEntry holds a Method*; and the comment “Format of an itable”: an offset table of (Klass* of interface, offset) entries, followed by one method table per interface, each entry a Method* (and compiler entry point).',
    shaped: 'Chapters 295 and 296: HotSpot’s per-class vtable, and its itable of interface method tables found through an offset table.',
  },
];
