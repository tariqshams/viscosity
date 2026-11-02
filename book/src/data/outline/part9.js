export default {
  id: 'IX', track: 'A', days: '72–74', title: 'Beyond JavaScript',
  blurb: 'A Python front-end plugin, WebAssembly as a target, the research frontier, and shipping Viscosity.',
  chapters: [
    { n: 285, title: 'A second language: why plugins pay off', introduces: { 'multi-language-ir': 'one IR serving several source languages' } },
    { n: 286, title: 'A small Python front-end', introduces: {
      'indentation-tokens': 'INDENT/DEDENT tokens for significant whitespace',
    } },
    { n: 287, title: 'The Python subset and its parser', introduces: {
      'python-subset': 'the part of Python Viscosity understands',
    } },
    { n: 288, title: 'Lowering Python to VIR', introduces: { 'semantic-differences': 'where Python and JavaScript behave differently' } },
    { n: 289, title: 'Emitting Python with column storage', introduces: { 'python-array-module': 'Python’s array module for compact numeric columns' } },
    { n: 290, title: 'WebAssembly as a target', introduces: { webassembly: 'a portable low-level binary format', 'linear-memory': 'WebAssembly’s single flat memory' } },
    { n: 291, title: 'The research frontier', introduces: { 'open-problems': 'what nobody has solved yet' } },
    { n: 292, title: 'Shipping Viscosity', introduces: {
      'npm-package': 'publishing a library to npm',
    } },
    { n: 293, title: 'Semantic versioning: what a version promises', introduces: {
      'semantic-versioning': 'major.minor.patch versions',
    } },
    { n: 294, title: 'Capstone: what you have built', introduces: { capstone: 'putting it all together' } },
  ],
};
