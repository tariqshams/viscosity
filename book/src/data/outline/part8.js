export default {
  id: 'VIII', track: 'A', days: '29–30', title: 'Beyond JavaScript',
  blurb: 'A Python front-end plugin, WebAssembly as a target, the research frontier, and shipping Viscosity.',
  chapters: [
    { n: 113, title: 'A second language: why plugins pay off', introduces: { 'multi-language-ir': 'one IR serving several source languages' } },
    { n: 114, title: 'A small Python front-end', introduces: { 'python-subset': 'the part of Python Viscosity understands', 'indentation-tokens': 'INDENT/DEDENT tokens for significant whitespace' } },
    { n: 115, title: 'Lowering Python to VIR', introduces: { 'semantic-differences': 'where Python and JavaScript behave differently' } },
    { n: 116, title: 'Emitting Python with column storage', introduces: { 'python-array-module': 'Python’s array module for compact numeric columns' } },
    { n: 117, title: 'WebAssembly as a target', introduces: { webassembly: 'a portable low-level binary format', 'linear-memory': 'WebAssembly’s single flat memory' } },
    { n: 118, title: 'The research frontier', introduces: { 'open-problems': 'what nobody has solved yet' } },
    { n: 119, title: 'Shipping Viscosity', introduces: { 'npm-package': 'publishing a library to npm', 'semantic-versioning': 'major.minor.patch versions' } },
    { n: 120, title: 'Capstone: what you have built', introduces: { capstone: 'putting it all together' } },
  ],
};
