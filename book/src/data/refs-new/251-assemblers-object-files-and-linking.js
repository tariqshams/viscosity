// New references for chapter 246 (and its staged second half, 238-b).
// The RISC-V psABI, ISA manual and assembly manual are cited with the ids
// added for chapter 225 (refs-new/230-machine-code-and-assembly.js).
export default [
  {
    id: 'elf-gabi',
    authors: ['Xinuos, Inc.', 'The System V ABI committee'],
    title: 'ELF Object File Format (System V gABI), version 4.2',
    venue: 'System V Application Binary Interface, generic part; github.com/xinuos/gabi',
    year: null,
    doi: null,
    url: 'https://gabi.xinuos.com/v42/index.html',
    accessed: '2026-11-02',
    checkedAgainst: 'The source of the specification, cloned from https://github.com/xinuos/gabi (commit 81337e4611a7789761bdb4a46be12cac5a08dab1, 3 Sep 2025), whose README calls it “the official repository for the ELF Object File Format specification, part of the SVR4 gABI” and links the published version 4.2. Read: docsrc/elf/01-intro.rst (the three main types of object file: relocatable, executable and shared object, quoted in the chapters; “Created by the assembler and link editor”; the shared object is combined with an executable by the dynamic linker), 02-eheader.rst (ET_REL 1, ET_EXEC 2, ET_DYN 3; e_entry), 03-sheader.rst (SHT_SYMTAB, SHT_RELA, SHN_UNDEF), 05-symtab.rst (STB_LOCAL, STB_GLOBAL: “One file’s definition of a global symbol will satisfy another file’s undefined reference to the same global symbol”; STB_WEAK lower precedence; the link editor “does not allow multiple definitions of STB_GLOBAL symbols with the same name”), 06-reloc.rst (“Relocation is the process of connecting symbolic references with symbolic definitions”; Elf32_Rel and Elf32_Rela) and 07-pheader.rst (PT_LOAD: “The bytes from the file are mapped to the beginning of the memory segment. If the segment’s memory size (p_memsz) is larger than the file size (p_filesz), the “extra” bytes are defined to hold the value 0”; PT_INTERP). gabi.xinuos.com and the older sco.com copy could not be fetched from this session.',
    shaped: 'Chapters 246 and 246-b: object files, sections, symbols and their binding, relocation entries, file types, program headers and loading.',
  },
  {
    id: 'levine1999',
    authors: ['John R. Levine'],
    title: 'Linkers and Loaders',
    venue: 'Morgan Kaufmann, ISBN 1-55860-496-0',
    year: 1999,
    doi: null,
    url: 'https://compilers.iecc.com/comparch/article/99-10-134',
    accessed: '2026-11-02',
    checkedAgainst: 'Bibliographic details only, from web search results: the comp.compilers announcement of the book (compilers.iecc.com/comparch/article/99-10-134) and reviews (os2museum.com, accu.org) giving Morgan Kaufmann, October 1999, ISBN 1-55860-496-0 (ISBN-13 978-1-55860-496-4), about 256 pages, covering object files, symbol resolution, relocation, static and shared libraries, and dynamic linking and loading. The book itself was not read for these chapters; every specific claim in them is checked against the ELF gABI, the RISC-V psABI, lld’s design notes or real tool output instead, and this entry is the general reference for the subject.',
    shaped: 'Chapters 246 and 246-b: the standard book-length treatment of assemblers’ output, linkers and loaders, offered as further reading.',
  },
  {
    id: 'lld-newlld',
    authors: ['The LLVM Project'],
    title: 'The ELF, COFF and Wasm Linkers (lld design notes, NewLLD.md)',
    venue: 'llvm-project repository, lld/docs/NewLLD.md',
    year: null,
    doi: null,
    url: 'https://github.com/llvm/llvm-project/blob/main/lld/docs/NewLLD.md',
    accessed: '2026-11-02',
    checkedAgainst: 'lld/docs/NewLLD.md from a sparse clone of llvm-project (commit f255ebf7065421c90112640aee4bc669a8b2001e, 2 Nov 2026), section “Efficient archive file handling”: “The traditional Unix linker maintains a set of undefined symbols during linking. The linker visits each file in the order as they appeared in the command line until the set becomes empty … If the linker visits an archive file, it checks for the archive file’s symbol table and extracts all object files that have definitions for any symbols in the set.”, and LLD instead “memorizes all symbols”; section “Important Data Structures”: symbols are Defined, Undefined or Lazy, and the symbol table keeps one Symbol per name. Error messages quoted in the chapter (“undefined symbol: sumsq”, “duplicate symbol: sumsq”) come from running ld.lld (LLD 18.1.3) in this session.',
    shaped: 'Chapter 246-b: symbol resolution, archives and the linker’s symbol table, with real lld messages.',
  },
];
