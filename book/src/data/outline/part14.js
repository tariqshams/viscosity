export default {
  id: 'XIV', track: 'B', days: '114–115', title: 'Shipping',
  blurb: 'The command-line interface, release builds, the TypeScript vs Rust benchmark matrix, and the capstone.',
  chapters: [
    { n: 454, title: 'A command-line interface', introduces: {
      cli: 'a program driven from the terminal',
    } },
    { n: 455, title: 'Parsing arguments by hand', introduces: {
      'argument-parsing': 'turning command-line flags into options',
    } },
    { n: 456, title: 'Release engineering', introduces: { 'release-process': 'versioning, changelogs and publishing' } },
    { n: 457, title: 'The final benchmark matrix', introduces: { 'benchmark-matrix': 'every layout × engine × implementation' } },
    { n: 458, title: 'Capstone: the whole machine', introduces: { mastery: 'being able to build it again yourself' } },
  ],
};
