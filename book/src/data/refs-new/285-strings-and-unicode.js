// New references for chapter 285. Checked 2026-11-02. The chapter also
// relies on mdn-string (re-read raw from github.com/mdn/content,
// files/en-us/web/javascript/reference/global_objects/string/index.md:
// strings are sequences of UTF-16 code units; surrogate pairs use
// 0xD800–0xDFFF; a grapheme cluster is a sequence of Unicode characters
// that should be treated as one visual unit), mdn-charcodeat and
// rust-std-string. Evidence produced in this session: Node 22.23.4
// (lengths, Buffer bytes, Intl.Segmenter counts, normalize, and
// %DebugPrint types under --allow-natives-syntax), Python 3.13.18 (len,
// ord, encode), rustc 1.97.0 (len, chars().count() and the char-boundary
// panic) and the Drip companion (len("👍") printed 1).
export default [
  {
    id: 'mdn-intl-segmenter',
    authors: ['MDN contributors'],
    title: 'Intl.Segmenter',
    venue: 'MDN Web Docs',
    year: null,
    doi: null,
    url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/Segmenter',
    accessed: '2026-11-02',
    checkedAgainst: 'Page source read raw from github.com/mdn/content (files/en-us/web/javascript/reference/global_objects/intl/segmenter/index.md) on 2026-11-02: “The Intl.Segmenter object enables locale-sensitive text segmentation, enabling you to get meaningful items (graphemes, words or sentences) from a string.” developer.mozilla.org itself was not reachable from this session.',
    shaped: 'Chapter 285: splitting a string into grapheme clusters in JavaScript.',
  },
  {
    id: 'rfc3629',
    authors: ['François Yergeau'],
    title: 'UTF-8, a transformation format of ISO 10646',
    venue: 'IETF RFC 3629 (STD 63)',
    year: 2003,
    doi: null,
    url: 'https://www.rfc-editor.org/rfc/rfc3629',
    accessed: '2026-11-02',
    checkedAgainst: 'Web search on 2026-11-02 (rfc-editor.org info page, IETF datatracker): RFC 3629, F. Yergeau, November 2003, Standards Track, STD 63, obsoletes RFC 2279; characters from the U+0000..U+10FFFF range are encoded using sequences of 1 to 4 octets, ASCII text is valid UTF-8, and the surrogate range U+D800–U+DFFF is excluded. The RFC text could not be opened from this session; the byte patterns in the chapter were also checked by running Node’s Buffer and Python’s str.encode on the boundary code points.',
    shaped: 'Chapter 285: the UTF-8 encoding and the Unicode code space.',
  },
  {
    id: 'pep393',
    authors: ['Martin v. Löwis'],
    title: 'PEP 393: Flexible String Representation',
    venue: 'Python Enhancement Proposals',
    year: 2010,
    doi: null,
    url: 'https://peps.python.org/pep-0393/',
    accessed: '2026-11-02',
    checkedAgainst: 'Read raw from github.com/python/peps (peps/pep-0393.rst) on 2026-11-02: “The Unicode string type is changed to support multiple internal representations, depending on the character with the largest Unicode ordinal (1, 2, or 4 bytes). This will allow a space-efficient representation in common cases, but give access to full UCS-4 on all systems.” peps.python.org itself was not reachable from this session.',
    shaped: 'Chapter 285: how CPython stores strings.',
  },
  {
    id: 'v8-src-string-h',
    authors: ['The V8 Project Authors'],
    title: 'V8 source: src/objects/string.h',
    venue: 'github.com/v8/v8 (main)',
    year: null,
    doi: null,
    url: 'https://github.com/v8/v8/blob/main/src/objects/string.h',
    accessed: '2026-11-02',
    checkedAgainst: 'Read raw from raw.githubusercontent.com/v8/v8/main/src/objects/string.h on 2026-11-02: “The ConsString class describes string values built by using the addition operator on strings. A ConsString is a pair where the first and second components are pointers to other string values. One or both components of a ConsString can be pointers to other ConsStrings, creating a binary tree of ConsStrings where the leaves are non-ConsString string values.” The SlicedString comment: a substring “described as a pointer to the parent, the offset from the start of the parent string and the length”; String::Flatten (“Non-flat ConsStrings are physically flattened by allocating a sequential string”); SeqOneByteString (“Each character in the OneByteString is an one-byte character”).',
    shaped: 'Chapter 285: V8’s cons strings as ropes, sliced strings and one-byte strings.',
  },
  {
    id: 'boehm1995',
    authors: ['Hans-J. Boehm', 'Russ Atkinson', 'Michael Plass'],
    title: 'Ropes: an Alternative to Strings',
    venue: 'Software: Practice and Experience 25(12), pp. 1315–1330',
    year: 1995,
    doi: '10.1002/spe.4380251203',
    url: 'https://doi.org/10.1002/spe.4380251203',
    accessed: '2026-11-02',
    checkedAgainst: 'Web search on 2026-11-02 (a BibSonomy entry, the copy in the Tufts course archive, Xerox PARC report CSL-94-10): Software: Practice and Experience 25(12):1315–1330, December 1995, DOI 10.1002/spe.4380251203; ropes are tree-structured strings whose leaves are flat character arrays, used in the Xerox Cedar environment. The publisher’s page could not be opened from this session.',
    shaped: 'Chapter 285: the rope.',
  },
];
