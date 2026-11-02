export default {
  id: 'XVIII', section: 'deep', days: '38–40', title: 'Deep dive: Viscosity and Drip extras',
  blurb: 'The Python plugin, the browser playground, compiling in parallel, and the research frontier.',
  chapters: [
    { n: 317, title: 'A second language: why plugins pay off', introduces: {
      'multi-language-ir': 'one IR serving several source languages',
    } },
    { n: 318, title: 'A small Python front-end', introduces: {
      'indentation-tokens': 'INDENT/DEDENT tokens for significant whitespace',
    } },
    { n: 319, title: 'The Python subset and its parser', introduces: {
      'python-subset': 'the part of Python Viscosity understands',
    } },
    { n: 320, title: 'Lowering Python to VIR', introduces: {
      'semantic-differences': 'where Python and JavaScript behave differently',
    } },
    { n: 321, title: 'Emitting Python with column storage', introduces: {
      'python-array-module': 'Python’s array module for compact numeric columns',
    } },
    { n: 322, title: 'The Python plugin in Rust', introduces: {
      'rust-python-plugin': 'the Python front-end in Rust',
    } },
    { n: 323, title: 'The browser playground', introduces: {
      playground: 'the compiler running in a web page',
    } },
    { n: 324, title: 'Compiling in parallel', introduces: {
      'data-parallelism': 'splitting work across CPU cores',
    } },
    { n: 325, title: 'One bad file, and how fast it gets', introduces: {} },
    { n: 326, title: 'The research frontier', introduces: {
      'open-problems': 'what nobody has solved yet',
    } },
  ],
};
